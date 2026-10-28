import {
  GUEST_CART_HEADER,
  type AddCartItemRequest,
  type ApplyCouponRequest,
  type MergeCartRequest,
  type QuoteDto,
  type UpdateCartItemRequest,
} from '@adapters/http/contracts'

import { db, type CartRecord } from '@mocks/db/database'
import { addEth, percentOfEth } from '@mocks/db/eth'
import { ApiError, commitJson, readJson, route } from '@mocks/http/respond'
import { scenarios } from '@mocks/scenarios/scenarios'
import { authenticate, bearerToken } from '@mocks/services/auth'
import { mergeGuestIntoUserCart } from '@mocks/services/cart-merge'
import {
  cartFingerprint,
  findValidCoupon,
  firstUnavailableLine,
  resolveLines,
  summarize,
  toCartDto,
  toQuoteLine,
} from '@mocks/services/pricing'
import { realtimeHub } from '@mocks/socket/realtime-hub'

const QUOTE_TTL_MS = 10 * 60_000
const PRICE_CHANGE_DELAY_MS = 1_000

/** Carrinho do usuário (sessão) ou do visitante (`X-Guest-Cart-Id`). */
const ownerOf = (request: Request, requireOwner: boolean): string | null => {
  if (bearerToken(request)) return `user:${authenticate(request).user.id}`
  const guestId = request.headers.get(GUEST_CART_HEADER)
  if (guestId) return `guest:${guestId}`
  if (requireOwner) throw new ApiError(400, 'VALIDATION_FAILED', 'Carrinho de visitante não identificado')
  return null
}

const emptyGuestCart = (): CartRecord => ({ owner: 'guest:new', lines: [], couponCode: null, version: 0 })

/** Estoque atual da edição no banco simulado (`undefined` se não existir). */
const availabilityOf = (nftId: string, editionId: string) =>
  db.findNft(nftId)?.editions.find((edition) => edition.id === editionId)?.available

const editionOrFail = (nftId: string, editionId: string) => {
  const nft = db.findNft(nftId)
  if (!nft) throw new ApiError(404, 'NFT_NOT_FOUND', 'NFT não encontrado')
  const edition = nft.editions.find((candidate) => candidate.id === editionId)
  if (!edition) throw new ApiError(404, 'EDITION_NOT_FOUND', 'Edição não encontrada')
  return edition
}

/** Quantidade inteira, positiva e dentro do estoque da edição. */
const assertQuantity = (quantity: unknown, available: number): number => {
  if (typeof quantity !== 'number' || !Number.isSafeInteger(quantity) || quantity < 1) {
    throw new ApiError(422, 'INVALID_QUANTITY', 'Quantidade inválida', {
      quantity: ['A quantidade deve ser um número inteiro maior que zero'],
    })
  }
  if (available === 0) throw new ApiError(409, 'EDITION_SOLD_OUT', 'Esta edição está esgotada')
  if (quantity > available) {
    throw new ApiError(
      409,
      'QUANTITY_EXCEEDS_AVAILABILITY',
      `Quantidade indisponível: restam ${available} unidade(s) desta edição`,
    )
  }
  return quantity
}

const touch = (cart: CartRecord) => {
  cart.version += 1
  return commitJson(toCartDto(cart))
}

const findLine = (cart: CartRecord, lineId: string) => {
  const line = cart.lines.find((item) => `${item.nftId}:${item.editionId}` === lineId)
  if (!line) throw new ApiError(404, 'EDITION_NOT_FOUND', 'Item não está no carrinho')
  return line
}

/** Sobe o preço do primeiro item em 10% e emite `nft.updated` (cenário `price-changed`). */
const schedulePriceChange = (nftId: string, editionId: string) => {
  setTimeout(() => {
    const updated = db.updateNft(nftId, (nft) => ({
      ...nft,
      editions: nft.editions.map((edition) => {
        if (edition.id !== editionId) return edition
        return { ...edition, priceEth: addEth(edition.priceEth, percentOfEth(edition.priceEth, 1_000)) }
      }),
    }))
    if (!updated) return
    db.commit()
    realtimeHub.nftUpdated(updated)
  }, PRICE_CHANGE_DELAY_MS)
}

export const cartHandlers = [
  route('get', '/cart', ({ request }) => {
    const owner = ownerOf(request, false)
    return commitJson(toCartDto(owner ? db.cart(owner) : emptyGuestCart()))
  }),

  route('post', '/cart/items', async ({ request }) => {
    const cart = db.cart(ownerOf(request, true) ?? '')
    const body = await readJson<AddCartItemRequest>(request)
    const edition = editionOrFail(body.nftId ?? '', body.editionId ?? '')
    const existing = cart.lines.find((line) => line.nftId === body.nftId && line.editionId === body.editionId)
    const requested =
      typeof body.quantity === 'number' ? body.quantity + (existing?.quantity ?? 0) : body.quantity
    const quantity = assertQuantity(requested, edition.available)
    if (existing) existing.quantity = quantity
    else cart.lines.push({ nftId: body.nftId ?? '', editionId: edition.id, quantity })
    return touch(cart)
  }),

  route('patch', '/cart/items/:lineId', async ({ request, params }) => {
    const cart = db.cart(ownerOf(request, true) ?? '')
    const line = findLine(cart, params.lineId ?? '')
    const body = await readJson<UpdateCartItemRequest>(request)
    line.quantity = assertQuantity(body.quantity, editionOrFail(line.nftId, line.editionId).available)
    return touch(cart)
  }),

  route('delete', '/cart/items/:lineId', ({ request, params }) => {
    const cart = db.cart(ownerOf(request, true) ?? '')
    findLine(cart, params.lineId ?? '')
    cart.lines = cart.lines.filter((item) => `${item.nftId}:${item.editionId}` !== params.lineId)
    if (cart.lines.length === 0) cart.couponCode = null
    return touch(cart)
  }),

  route('put', '/cart/coupon', async ({ request }) => {
    const cart = db.cart(ownerOf(request, true) ?? '')
    const body = await readJson<ApplyCouponRequest>(request)
    if (cart.lines.length === 0)
      throw new ApiError(422, 'CART_EMPTY', 'Adicione itens antes de aplicar um cupom')
    cart.couponCode = findValidCoupon((body.code ?? '').trim().toUpperCase()).code
    return touch(cart)
  }),

  route('delete', '/cart/coupon', ({ request }) => {
    const cart = db.cart(ownerOf(request, true) ?? '')
    cart.couponCode = null
    return touch(cart)
  }),

  /** Leva o carrinho do visitante para o usuário (regra em `mergeGuestIntoUserCart`). */
  route('post', '/cart/merge', async ({ request }) => {
    const { user } = authenticate(request)
    const body = await readJson<MergeCartRequest>(request)
    const cart = db.cart(`user:${user.id}`)
    const guest = db.state.carts.find((item) => item.owner === `guest:${body.guestCartId ?? ''}`)
    if (guest) {
      const merged = mergeGuestIntoUserCart(cart, guest, availabilityOf)
      cart.lines = [...merged.lines]
      cart.couponCode = merged.couponCode
      db.state.carts = db.state.carts.filter((item) => item !== guest)
    }
    return touch(cart)
  }),

  route('post', '/quotes', ({ request }) => {
    const { user } = authenticate(request)
    const cart = db.cart(`user:${user.id}`)
    const lines = resolveLines(cart)
    if (lines.length === 0) throw new ApiError(422, 'CART_EMPTY', 'Seu carrinho está vazio')
    const unavailable = firstUnavailableLine(lines)
    if (unavailable) {
      throw new ApiError(
        409,
        unavailable.available === 0 ? 'EDITION_SOLD_OUT' : 'QUANTITY_EXCEEDS_AVAILABILITY',
        `${unavailable.nftName} (${unavailable.editionName}) não tem estoque suficiente`,
      )
    }

    const cartDto = toCartDto(cart)
    for (const previous of db.state.quotes) if (previous.userId === user.id) previous.superseded = true
    const now = Date.now()
    const quote: QuoteDto = {
      id: db.nextId('quote', 'qte'),
      lines: lines.map(toQuoteLine),
      coupon: cartDto.coupon,
      summary: summarize(lines, cartDto.coupon),
      createdAt: new Date(now).toISOString(),
      expiresAt: new Date(now + QUOTE_TTL_MS).toISOString(),
    }
    db.state.quotes.push({ userId: user.id, quote, fingerprint: cartFingerprint(cart), superseded: false })

    const first = lines[0]
    if (first && scenarios.is('price-changed') && scenarios.once('price-changed')) {
      schedulePriceChange(first.nftId, first.editionId)
    }
    return commitJson(quote, { status: 201 })
  }),
]
