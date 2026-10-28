import { cartLineId, type Cart } from '@domain/entities/cart'
import type { AppliedCoupon, PriceSummary } from '@domain/entities/pricing'
import { EthAmount } from '@domain/value-objects/eth-amount'

export type QuoteLine = {
  readonly nftId: string
  readonly editionId: string
  /** Número do token exibido como "ID do token" (ex.: `#0042`). */
  readonly tokenId: string
  readonly nftName: string
  readonly editionName: string
  /** Tiragem da edição (`null` = aberta). */
  readonly editionSupply: number | null
  readonly imageUrl: string
  readonly unitPriceEth: string
  readonly quantity: number
  readonly available: number
  readonly lineTotalEth: string
}

/** Cotação congelada pela API para o checkout. Só ela vale como referência de valores. */
export type Quote = {
  readonly id: string
  readonly lines: readonly QuoteLine[]
  readonly coupon: AppliedCoupon | null
  readonly summary: PriceSummary
  readonly createdAt: string
  readonly expiresAt: string
}

export type QuoteChange =
  | {
      readonly kind: 'price'
      readonly nftName: string
      readonly editionName: string
      readonly previousEth: string
      readonly currentEth: string
    }
  | {
      readonly kind: 'availability'
      readonly nftName: string
      readonly editionName: string
      readonly requested: number
      readonly available: number
    }
  | { readonly kind: 'line-removed'; readonly nftName: string; readonly editionName: string }
  | { readonly kind: 'coupon'; readonly previousCode: string | null; readonly currentCode: string | null }
  | { readonly kind: 'network-fee'; readonly previousEth: string; readonly currentEth: string }
  | { readonly kind: 'total'; readonly previousEth: string; readonly currentEth: string }

export const isQuoteExpired = (quote: Quote, now: Date) =>
  new Date(quote.expiresAt).getTime() <= now.getTime()

const sameEth = (a: string, b: string) => EthAmount.of(a).equals(EthAmount.of(b))
const lineKey = (line: QuoteLine) => cartLineId(line.nftId, line.editionId)

/**
 * Diferenças relevantes entre a cotação revisada pelo usuário e a revalidada.
 * Qualquer item na lista exige nova confirmação antes de enviar o pedido.
 */
export const diffQuotes = (previous: Quote, next: Quote): readonly QuoteChange[] => {
  const changes: QuoteChange[] = []
  const nextLines = new Map(next.lines.map((line) => [lineKey(line), line]))

  for (const before of previous.lines) {
    const after = nextLines.get(lineKey(before))
    if (!after) {
      changes.push({ kind: 'line-removed', nftName: before.nftName, editionName: before.editionName })
      continue
    }
    if (!sameEth(before.unitPriceEth, after.unitPriceEth)) {
      changes.push({
        kind: 'price',
        nftName: after.nftName,
        editionName: after.editionName,
        previousEth: before.unitPriceEth,
        currentEth: after.unitPriceEth,
      })
    }
    if (after.available < before.quantity || after.quantity !== before.quantity) {
      changes.push({
        kind: 'availability',
        nftName: after.nftName,
        editionName: after.editionName,
        requested: before.quantity,
        available: after.available,
      })
    }
  }

  if ((previous.coupon?.code ?? null) !== (next.coupon?.code ?? null)) {
    changes.push({
      kind: 'coupon',
      previousCode: previous.coupon?.code ?? null,
      currentCode: next.coupon?.code ?? null,
    })
  }
  if (!sameEth(previous.summary.networkFeeEth, next.summary.networkFeeEth)) {
    changes.push({
      kind: 'network-fee',
      previousEth: previous.summary.networkFeeEth,
      currentEth: next.summary.networkFeeEth,
    })
  }
  if (!sameEth(previous.summary.totalEth, next.summary.totalEth)) {
    changes.push({ kind: 'total', previousEth: previous.summary.totalEth, currentEth: next.summary.totalEth })
  }

  return changes
}

/**
 * A cotação deixou de refletir o carrinho atual (preço, estoque, itens ou
 * cupom mudaram, por exemplo via `nft.updated`). O checkout bloqueia o envio
 * até uma nova cotação ser revisada.
 */
export const isQuoteOutdated = (quote: Quote, cart: Cart): boolean => {
  if (cart.lines.length !== quote.lines.length) return true
  if ((cart.coupon?.code ?? null) !== (quote.coupon?.code ?? null)) return true
  const cartLines = new Map(cart.lines.map((line) => [line.id, line]))
  return quote.lines.some((line) => {
    const current = cartLines.get(lineKey(line))
    return (
      !current ||
      current.quantity !== line.quantity ||
      current.available < line.quantity ||
      !sameEth(current.unitPriceEth, line.unitPriceEth)
    )
  })
}
