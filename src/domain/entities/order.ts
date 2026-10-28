import type { OrderCollector, OrderPayment } from '@domain/entities/checkout-form'
import type { AppliedCoupon, PriceSummary } from '@domain/entities/pricing'

export type { OrderCollector, OrderPayment } from '@domain/entities/checkout-form'

export type OrderStatus = 'pending' | 'confirmed' | 'rejected'

export type OrderLine = {
  readonly nftId: string
  readonly editionId: string
  /** Número do token exibido como "ID do token" (ex.: `#0042`). */
  readonly tokenId: string
  readonly nftName: string
  readonly editionName: string
  readonly imageUrl: string
  readonly unitPriceEth: string
  readonly quantity: number
  readonly lineTotalEth: string
}

export type OrderTransaction = {
  readonly hash: string
  readonly explorerUrl: string
}

export type Order = {
  readonly id: string
  readonly status: OrderStatus
  readonly version: number
  readonly lines: readonly OrderLine[]
  readonly coupon: AppliedCoupon | null
  readonly summary: PriceSummary
  readonly collector: OrderCollector
  readonly payment: OrderPayment
  /** Presente somente quando a simulação confirma o pagamento. */
  readonly transaction: OrderTransaction | null
  readonly rejectionReason: string | null
  readonly createdAt: string
  readonly updatedAt: string
}

/** Confirmado e recusado são finais: nenhum evento posterior os altera. */
export const isTerminalStatus = (status: OrderStatus) => status !== 'pending'

/** Confirmação e recibo só existem para pedido confirmado pela simulação. */
export const isConfirmed = (order: Order): order is Order & { readonly transaction: OrderTransaction } =>
  order.status === 'confirmed' && order.transaction !== null

/**
 * Aplica uma leitura nova do pedido (REST ou evento) sem regredir estado:
 * versões iguais ou antigas são ignoradas e estados finais nunca mudam.
 */
export const reconcileOrder = (current: Order | undefined, incoming: Order): Order => {
  if (!current) return incoming
  if (incoming.id !== current.id) return current
  if (isTerminalStatus(current.status)) return current
  return incoming.version > current.version ? incoming : current
}
