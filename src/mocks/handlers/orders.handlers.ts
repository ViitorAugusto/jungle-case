import { delay, HttpResponse } from 'msw'

import {
  IDEMPOTENCY_KEY_HEADER,
  IDEMPOTENT_REPLAY_HEADER,
  type CreateOrderRequest,
  type OrderDto,
} from '@adapters/http/contracts'

import { addEth, percentOfEth } from '@mocks/db/eth'
import { db, type OrderRecord } from '@mocks/db/database'
import { ApiError, commitJson, readJson, route, validationError } from '@mocks/http/respond'
import { HANG_MS, scenarios } from '@mocks/scenarios/scenarios'
import { authenticate } from '@mocks/services/auth'
import { scheduleSettlement } from '@mocks/services/payments'
import { cartFingerprint, firstUnavailableLine, resolveLines, toOrderLine } from '@mocks/services/pricing'
import { validateOrderForm } from '@mocks/services/order-form'
import { realtimeHub } from '@mocks/socket/realtime-hub'

/** Impressão digital canônica do corpo: mesma chave + corpo diferente = 409. */
const fingerprintOf = (body: Partial<CreateOrderRequest>) => {
  const collector: Partial<CreateOrderRequest['collector']> = body.collector ?? {}
  const payment: Partial<CreateOrderRequest['payment']> = body.payment ?? {}
  return JSON.stringify([
    body.quoteId ?? null,
    collector.displayName ?? null,
    collector.username ?? null,
    collector.profileName ?? null,
    collector.email ?? null,
    collector.ensName ?? null,
    collector.referralCode ?? null,
    collector.note ?? null,
    payment.network ?? null,
    payment.address ?? null,
    payment.secondaryAddressOrEns ?? null,
    payment.provider ?? null,
    payment.walletId ?? null,
  ])
}

const ownOrder = (request: Request, orderId: string): OrderRecord => {
  const { user } = authenticate(request)
  const record = db.findOrder(orderId)
  if (!record) throw new ApiError(404, 'ORDER_NOT_FOUND', 'Pedido não encontrado')
  if (record.userId !== user.id) throw new ApiError(403, 'FORBIDDEN', 'Este pedido pertence a outra conta')
  return record
}

/** Esgota a edição do primeiro item e avisa os clientes (cenário `edition-sold-out`). */
const sellOut = (nftId: string, editionId: string) => {
  const updated = db.updateNft(nftId, (nft) => ({
    ...nft,
    editions: nft.editions.map((edition) =>
      edition.id === editionId ? { ...edition, available: 0 } : edition,
    ),
  }))
  if (updated) realtimeHub.nftUpdated(updated)
}

/**
 * Sobe 10% o preço da edição só no banco, sem `nft.updated` (cenário
 * `quote-outdated-on-order`): a interface não fica sabendo, o servidor sim.
 */
const raisePriceSilently = (nftId: string, editionId: string) => {
  db.updateNft(nftId, (nft) => ({
    ...nft,
    editions: nft.editions.map((edition) =>
      edition.id === editionId
        ? { ...edition, priceEth: addEth(edition.priceEth, percentOfEth(edition.priceEth, 1_000)) }
        : edition,
    ),
  }))
}

export const ordersHandlers = [
  /**
   * Criação idempotente: a chave é checada antes de qualquer validação, então
   * o reenvio de um pedido já criado sempre o recupera (mesmo após timeout ou
   * cotação substituída).
   */
  route('post', '/orders', async ({ request }) => {
    const { user } = authenticate(request)
    const key = request.headers.get(IDEMPOTENCY_KEY_HEADER)
    if (!key) throw new ApiError(400, 'IDEMPOTENCY_KEY_REQUIRED', 'Cabeçalho Idempotency-Key obrigatório')

    const body = await readJson<CreateOrderRequest>(request)
    const fingerprint = fingerprintOf(body)
    const previous = db.state.idempotency.find((entry) => entry.userId === user.id && entry.key === key)
    if (previous) {
      if (previous.fingerprint !== fingerprint) {
        throw new ApiError(
          409,
          'IDEMPOTENCY_KEY_REUSED',
          'Esta tentativa de compra já foi usada com outros dados',
        )
      }
      const existing = db.findOrder(previous.orderId)
      if (!existing) throw new ApiError(404, 'ORDER_NOT_FOUND', 'Pedido não encontrado')
      return HttpResponse.json(existing.order, {
        status: 200,
        headers: { [IDEMPOTENT_REPLAY_HEADER]: 'true' },
      })
    }

    const form = validateOrderForm(
      body,
      (walletId) =>
        db.state.wallets.find((entry) => entry.userId === user.id && entry.wallet.slot === walletId)?.wallet,
    )
    if (!form.ok) throw validationError(form.fieldErrors)

    const quoteRecord = db.state.quotes.find(
      (entry) => entry.quote.id === body.quoteId && entry.userId === user.id,
    )
    if (!quoteRecord)
      throw new ApiError(409, 'QUOTE_NOT_FOUND', 'Cotação não encontrada. Revise o pedido novamente')
    if (new Date(quoteRecord.quote.expiresAt).getTime() <= Date.now()) {
      throw new ApiError(409, 'QUOTE_EXPIRED', 'A cotação expirou. Revise os valores e confirme de novo')
    }

    const cart = db.cart(`user:${user.id}`)
    const first = quoteRecord.quote.lines[0]
    if (first && scenarios.is('edition-sold-out') && scenarios.once('edition-sold-out')) {
      sellOut(first.nftId, first.editionId)
      db.commit()
    }
    if (first && scenarios.is('quote-outdated-on-order') && scenarios.once('quote-outdated-on-order')) {
      raisePriceSilently(first.nftId, first.editionId)
      db.commit()
    }
    const unavailable = firstUnavailableLine(resolveLines(cart))
    if (unavailable) {
      throw new ApiError(
        409,
        'EDITION_SOLD_OUT',
        `${unavailable.nftName} (${unavailable.editionName}) esgotou`,
      )
    }
    if (quoteRecord.superseded || quoteRecord.fingerprint !== cartFingerprint(cart)) {
      throw new ApiError(
        409,
        'QUOTE_OUTDATED',
        'Preço, estoque, cupom ou taxa mudaram. Revise e confirme de novo',
      )
    }

    const now = new Date()
    const order: OrderDto = {
      id: db.nextId('order', 'ord'),
      status: 'pending',
      version: 1,
      lines: quoteRecord.quote.lines.map(toOrderLine),
      coupon: quoteRecord.quote.coupon,
      summary: quoteRecord.quote.summary,
      collector: form.collector,
      payment: form.payment,
      transaction: null,
      rejectionReason: null,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    }
    const record: OrderRecord = {
      userId: user.id,
      order,
      receipt: null,
      settleAt: new Date(now.getTime() + scenarios.config.paymentDelayMs).toISOString(),
      outcome: scenarios.is('payment-rejected') ? 'reject' : 'confirm',
    }
    quoteRecord.superseded = true
    db.state.orders.push(record)
    db.state.idempotency.push({ userId: user.id, key, fingerprint, orderId: order.id })
    db.commit()
    scheduleSettlement(record)

    // Pedido criado, mas a resposta "se perde": o cliente esgota o tempo e reenvia com a mesma chave.
    if (scenarios.is('order-timeout-after-create') && scenarios.once('order-timeout-after-create')) {
      await delay(HANG_MS)
    }
    return commitJson(order, { status: 201 })
  }),

  route('get', '/orders/:id', ({ request, params }) => commitJson(ownOrder(request, params.id ?? '').order)),

  /** Recibo só para pedido confirmado pela simulação. */
  route('get', '/orders/:id/receipt', ({ request, params }) => {
    const record = ownOrder(request, params.id ?? '')
    if (record.order.status !== 'confirmed' || !record.receipt) {
      throw new ApiError(409, 'ORDER_NOT_CONFIRMED', 'O pagamento deste pedido ainda não foi confirmado')
    }
    return commitJson(record.receipt)
  }),
]
