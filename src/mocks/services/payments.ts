import type { NetworkDto, OrderDto } from '@adapters/http/contracts'

import { db, type OrderRecord } from '@mocks/db/database'
import { realtimeHub } from '@mocks/socket/realtime-hub'

const explorerBase: Record<NetworkDto, string> = {
  ethereum: 'https://etherscan.io/tx/',
  polygon: 'https://polygonscan.com/tx/',
  solana: 'https://solscan.io/tx/',
}

/** Hash de transação simulado, determinístico por pedido (FNV-1a repetido até 64 hex). */
const fakeTxHash = (seed: string) => {
  let hex = ''
  let hash = 0x811c9dc5
  for (let round = 0; hex.length < 64; round += 1) {
    for (const char of `${seed}:${round}`) {
      hash ^= char.charCodeAt(0)
      hash = Math.imul(hash, 0x01000193) >>> 0
    }
    hex += hash.toString(16).padStart(8, '0')
  }
  return `0x${hex.slice(0, 64)}`
}

const timers = new Map<string, ReturnType<typeof setTimeout>>()

const reject = (order: OrderDto, reason: string): OrderDto => ({
  ...order,
  status: 'rejected',
  version: order.version + 1,
  rejectionReason: reason,
  updatedAt: new Date().toISOString(),
})

/**
 * Resolve um pedido pendente conforme o cenário. Confirmação baixa o estoque
 * (emitindo `nft.updated`), tira do carrinho só os itens e quantidades
 * comprados e grava o recibo; recusa não toca no carrinho.
 */
const settle = (record: OrderRecord) => {
  timers.delete(record.order.id)
  if (record.order.status !== 'pending') return

  const lines = record.order.lines
  const hasStock = lines.every((line) => {
    const edition = db.findNft(line.nftId)?.editions.find((candidate) => candidate.id === line.editionId)
    return edition !== undefined && edition.available >= line.quantity
  })

  if (record.outcome === 'reject' || !hasStock) {
    record.order = reject(
      record.order,
      hasStock ? 'Pagamento recusado pela carteira' : 'Estoque insuficiente no momento da confirmação',
    )
  } else {
    const changed = lines.flatMap((line) => {
      const updated = db.updateNft(line.nftId, (nft) => ({
        ...nft,
        editions: nft.editions.map((edition) =>
          edition.id === line.editionId
            ? { ...edition, available: edition.available - line.quantity }
            : edition,
        ),
      }))
      return updated ? [updated] : []
    })

    const cart = db.cart(`user:${record.userId}`)
    for (const line of lines) {
      const cartLine = cart.lines.find(
        (item) => item.nftId === line.nftId && item.editionId === line.editionId,
      )
      if (cartLine) cartLine.quantity -= line.quantity
    }
    cart.lines = cart.lines.filter((line) => line.quantity > 0)
    if (cart.lines.length === 0) cart.couponCode = null
    cart.version += 1

    const hash = fakeTxHash(record.order.id)
    const now = new Date().toISOString()
    record.order = {
      ...record.order,
      status: 'confirmed',
      version: record.order.version + 1,
      transaction: { hash, explorerUrl: `${explorerBase[record.order.payment.network]}${hash}` },
      updatedAt: now,
    }
    record.receipt = {
      orderId: record.order.id,
      issuedAt: now,
      transaction: { hash, explorerUrl: `${explorerBase[record.order.payment.network]}${hash}` },
      lines: record.order.lines,
      coupon: record.order.coupon,
      summary: record.order.summary,
      collector: record.order.collector,
      payment: record.order.payment,
    }
    for (const nft of changed) realtimeHub.nftUpdated(nft)
  }

  db.commit()
  realtimeHub.orderUpdated(record.userId, record.order)
}

export const scheduleSettlement = (record: OrderRecord) => {
  if (record.order.status !== 'pending' || timers.has(record.order.id)) return
  const wait = Math.max(0, new Date(record.settleAt).getTime() - Date.now())
  timers.set(
    record.order.id,
    setTimeout(() => {
      settle(record)
    }, wait),
  )
}

/** Liquida pedidos vencidos (ex.: a página recarregou durante o pagamento) e reagenda os demais. */
export const settleDueOrders = () => {
  for (const record of db.state.orders) {
    if (record.order.status !== 'pending') continue
    if (new Date(record.settleAt).getTime() <= Date.now()) settle(record)
    else scheduleSettlement(record)
  }
}

export const cancelSettlements = () => {
  for (const timer of timers.values()) clearTimeout(timer)
  timers.clear()
}
