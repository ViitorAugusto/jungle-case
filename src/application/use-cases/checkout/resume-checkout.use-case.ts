import { isTerminalStatus, type Order } from '@domain/entities/order'

import { isApplicationError } from '@application/errors/application-error'
import type { OrderGateway } from '@application/ports/gateways/order.gateway'
import type { CheckoutAttemptStorage } from '@application/ports/services/checkout-attempt-storage'
import type { SessionState } from '@application/services/session-state'

/**
 * Recupera a compra em andamento após refresh, queda de conexão ou timeout,
 * sem criar pedido novo. Devolve `null` quando não há tentativa pendente.
 */
export class ResumeCheckoutUseCase {
  private readonly orders: OrderGateway
  private readonly attempts: CheckoutAttemptStorage
  private readonly session: SessionState

  constructor(orders: OrderGateway, attempts: CheckoutAttemptStorage, session: SessionState) {
    this.orders = orders
    this.attempts = attempts
    this.session = session
  }

  async execute(): Promise<Order | null> {
    const user = this.session.current?.user
    if (!user) return null
    const attempt = this.attempts.load(user.id)
    if (!attempt) return null

    try {
      const order = attempt.orderId
        ? await this.orders.findById(attempt.orderId)
        : await this.orders.create(attempt.payload, attempt.idempotencyKey)
      if (isTerminalStatus(order.status)) this.attempts.clear(user.id)
      else this.attempts.save(user.id, { ...attempt, orderId: order.id })
      return order
    } catch (error) {
      // Servidor provou que o pedido não existe: nada a recuperar.
      if (isApplicationError(error) && (error.code === 'CONFLICT' || error.code === 'NOT_FOUND')) {
        this.attempts.clear(user.id)
        return null
      }
      throw error
    }
  }
}
