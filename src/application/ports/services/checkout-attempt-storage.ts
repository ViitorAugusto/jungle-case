import type { CreateOrderPayload } from '@application/ports/gateways/order.gateway'

/**
 * Tentativa de compra em andamento. Guarda a chave de idempotência e o
 * conteúdo enviado para que reenvio (clique repetido, timeout, refresh)
 * recupere o mesmo pedido em vez de criar outro.
 */
export type CheckoutAttempt = {
  readonly idempotencyKey: string
  readonly payload: CreateOrderPayload
  /** Preenchido quando o servidor confirmou a criação do pedido. */
  readonly orderId: string | null
  readonly startedAt: string
}

export interface CheckoutAttemptStorage {
  load(userId: string): CheckoutAttempt | null
  save(userId: string, attempt: CheckoutAttempt): void
  clear(userId: string): void
}
