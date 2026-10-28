import type {
  CartDto,
  CartLineDto,
  CouponDto,
  OrderLineDto,
  PriceSummaryDto,
  QuoteLineDto,
} from '@adapters/http/contracts'

import { db, type CartRecord } from '@mocks/db/database'
import { addEth, minEth, mulEth, percentOfEth, roundEth, subEth } from '@mocks/db/eth'
import { fixtureCoupons, type CouponRecord } from '@mocks/db/fixtures'
import { ApiError } from '@mocks/http/respond'
import { scenarios } from '@mocks/scenarios/scenarios'

/** Taxa de rede estimada do Figma: fixa por pedido, independente da quantidade (0.016 ETH). */
const NETWORK_FEE = '0.016'

/** Linhas do carrinho com preço e estoque atuais (linhas de NFT/edição inexistentes são descartadas). */
export const resolveLines = (cart: CartRecord): CartLineDto[] =>
  cart.lines.flatMap((line) => {
    const nft = db.findNft(line.nftId)
    const edition = nft?.editions.find((candidate) => candidate.id === line.editionId)
    if (!nft || !edition) return []
    return [
      {
        id: `${line.nftId}:${line.editionId}`,
        nftId: nft.id,
        editionId: edition.id,
        tokenId: nft.tokenId,
        nftName: nft.name,
        editionName: edition.name,
        imageUrl: nft.images[0]?.url ?? '',
        unitPriceEth: edition.priceEth,
        quantity: line.quantity,
        available: edition.available,
        lineTotalEth: mulEth(edition.priceEth, line.quantity),
      },
    ]
  })

const toCouponDto = (coupon: CouponRecord): CouponDto => ({
  code: coupon.code,
  kind: coupon.kind,
  value: coupon.value,
  description: coupon.description,
})

/** Valida o cupom (cenários `coupon-invalid`/`coupon-expired` forçam a recusa). */
export const findValidCoupon = (code: string): CouponDto => {
  const coupon = fixtureCoupons.find((candidate) => candidate.code === code)
  if (scenarios.is('coupon-invalid') || !coupon) {
    throw new ApiError(422, 'COUPON_INVALID', 'Cupom inválido', { code: ['Cupom inválido'] })
  }
  if (scenarios.is('coupon-expired') || new Date(coupon.expiresAt).getTime() <= Date.now()) {
    throw new ApiError(422, 'COUPON_EXPIRED', 'Este cupom expirou', { code: ['Este cupom expirou'] })
  }
  return toCouponDto(coupon)
}

/** Cupom aplicado que deixou de valer é ignorado no resumo (e removido do carrinho). */
const activeCoupon = (cart: CartRecord): CouponDto | null => {
  if (!cart.couponCode) return null
  const coupon = fixtureCoupons.find((candidate) => candidate.code === cart.couponCode)
  if (!coupon || new Date(coupon.expiresAt).getTime() <= Date.now()) {
    cart.couponCode = null
    return null
  }
  return toCouponDto(coupon)
}

export const summarize = (lines: readonly QuoteLineDto[], coupon: CouponDto | null): PriceSummaryDto => {
  const subtotalEth = addEth('0', ...lines.map((line) => line.lineTotalEth))
  const networkFeeEth = lines.length === 0 ? '0' : NETWORK_FEE
  // Desconto percentual arredondado a 3 casas, para o total seguir o formato do Figma.
  const rawDiscount = !coupon
    ? '0'
    : coupon.kind === 'percentage'
      ? roundEth(percentOfEth(subtotalEth, Number(coupon.value)))
      : coupon.value
  const discountEth = minEth(rawDiscount, subtotalEth)
  const totalEth = addEth(subEth(subtotalEth, discountEth), networkFeeEth)
  return { subtotalEth, discountEth, networkFeeEth, totalEth }
}

export const toCartDto = (cart: CartRecord): CartDto => {
  const lines = resolveLines(cart)
  const coupon = activeCoupon(cart)
  return {
    owner: cart.owner.startsWith('user:') ? 'user' : 'guest',
    lines,
    coupon,
    summary: summarize(lines, coupon),
    itemCount: lines.length,
    version: cart.version,
  }
}

/** Impressão digital do que a cotação congela: preços, quantidades, estoque suficiente, cupom e taxa. */
export const cartFingerprint = (cart: CartRecord): string => {
  const dto = toCartDto(cart)
  return JSON.stringify({
    lines: dto.lines.map((line) => [
      line.id,
      line.unitPriceEth,
      line.quantity,
      line.available >= line.quantity,
    ]),
    coupon: dto.coupon?.code ?? null,
    fee: dto.summary.networkFeeEth,
  })
}

/** Primeira linha sem estoque suficiente, se houver. */
export const firstUnavailableLine = (lines: readonly CartLineDto[]) =>
  lines.find((line) => line.quantity > line.available)

export const toQuoteLine = (line: CartLineDto): QuoteLineDto => ({
  nftId: line.nftId,
  editionId: line.editionId,
  tokenId: line.tokenId,
  nftName: line.nftName,
  editionName: line.editionName,
  imageUrl: line.imageUrl,
  unitPriceEth: line.unitPriceEth,
  quantity: line.quantity,
  available: line.available,
  lineTotalEth: line.lineTotalEth,
})

export const toOrderLine = (line: QuoteLineDto): OrderLineDto => ({
  nftId: line.nftId,
  editionId: line.editionId,
  tokenId: line.tokenId,
  nftName: line.nftName,
  editionName: line.editionName,
  imageUrl: line.imageUrl,
  unitPriceEth: line.unitPriceEth,
  quantity: line.quantity,
  lineTotalEth: line.lineTotalEth,
})
