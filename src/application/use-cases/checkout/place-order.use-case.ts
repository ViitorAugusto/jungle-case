import { toOrderParties, validateCheckoutForm } from '@domain/entities/checkout-form'
import { isTerminalStatus, type Order } from '@domain/entities/order'

import type { PlaceOrderInput } from '@application/dtos/inputs'
import { isApplicationError } from '@application/errors/application-error'
import { assertValid, validationFailed } from '@application/errors/validation'
import type { CreateOrderPayload, OrderGateway } from '@application/ports/gateways/order.gateway'
import type {
  CheckoutAttempt,
  CheckoutAttemptStorage,
} from '@application/ports/services/checkout-attempt-storage'
import type { Clock } from '@application/ports/services/clock'
import type { IdGenerator } from '@application/ports/services/id-generator'
import type { SessionState } from '@application/services/session-state'
import { requireSession } from '@application/services/require-session'

/** Forma canônica do conteúdo (chaves em ordem fixa) para comparar tentativas. */
const canonical = (payload: CreateOrderPayload) =>
  JSON.stringify([
    payload.quoteId,
    payload.collector.displayName,
    payload.collector.username,
    payload.collector.profileName,
    payload.collector.email,
    payload.collector.ensName,
    payload.collector.referralCode,
    payload.collector.note,
    payload.payment.network,
    payload.payment.address,
    payload.payment.secondaryAddressOrEns,
    payload.payment.provider,
    payload.payment.walletId,
  ])

export const samePayload = (a: CreateOrderPayload, b: CreateOrderPayload) => canonical(a) === canonical(b)

/** Erro que comprova que o pedido não foi criado (a tentativa pode ser descartada). */
const provesNotCreated = (error: unknown) =>
  isApplicationError(error) &&
  (error.code === 'CONFLICT' || error.code === 'VALIDATION' || error.code === 'NOT_FOUND')

/**
 * Envia o pedido sem nunca duplicar:
 * - a chave de idempotência é guardada antes do envio e reaproveitada em
 *   clique repetido, timeout ou refresh com o mesmo conteúdo;
 * - se a tentativa anterior terminou sem resposta e o conteúdo mudou, ela é
 *   reenviada primeiro (recupera o pedido se ele existir);
 * - enquanto houver pedido pendente, ele é devolvido em vez de criar outro.
 */
export class PlaceOrderUseCase {
  private readonly orders: OrderGateway
  private readonly attempts: CheckoutAttemptStorage
  private readonly session: SessionState
  private readonly ids: IdGenerator
  private readonly clock: Clock

  constructor(
    orders: OrderGateway,
    attempts: CheckoutAttemptStorage,
    session: SessionState,
    ids: IdGenerator,
    clock: Clock,
  ) {
    this.orders = orders
    this.attempts = attempts
    this.session = session
    this.ids = ids
    this.clock = clock
  }

  async execute(input: PlaceOrderInput): Promise<Order> {
    const { user } = requireSession(this.session)
    const payload = this.toPayload(input)
    const previous = this.attempts.load(user.id)

    if (previous) {
      const recovered = await this.recover(user.id, previous, payload)
      if (recovered) return recovered
    }

    const reusable = this.attempts.load(user.id)
    const attempt: CheckoutAttempt =
      reusable && samePayload(reusable.payload, payload)
        ? reusable
        : {
            idempotencyKey: this.ids.uuid(),
            payload,
            orderId: null,
            startedAt: this.clock.now().toISOString(),
          }
    this.attempts.save(user.id, attempt)

    try {
      const order = await this.orders.create(payload, attempt.idempotencyKey)
      this.attempts.save(user.id, { ...attempt, orderId: order.id })
      return order
    } catch (error) {
      if (provesNotCreated(error)) this.attempts.clear(user.id)
      throw error
    }
  }

  /** Devolve o pedido da tentativa anterior quando ele ainda está em andamento. */
  private async recover(userId: string, previous: CheckoutAttempt, payload: CreateOrderPayload) {
    if (previous.orderId) {
      try {
        const existing = await this.orders.findById(previous.orderId)
        if (!isTerminalStatus(existing.status)) return existing
      } catch (error) {
        // Pedido inexistente no servidor (ex.: ambiente resetado): a tentativa antiga é descartada.
        if (!provesNotCreated(error)) throw error
      }
      this.attempts.clear(userId)
      return null
    }
    if (samePayload(previous.payload, payload)) return null

    try {
      const order = await this.orders.create(previous.payload, previous.idempotencyKey)
      this.attempts.save(userId, { ...previous, orderId: order.id })
      if (!isTerminalStatus(order.status)) return order
      this.attempts.clear(userId)
      return null
    } catch (error) {
      if (!provesNotCreated(error)) throw error
      this.attempts.clear(userId)
      return null
    }
  }

  /** Valida o formulário (mesmas regras do servidor) e monta o conteúdo normalizado. */
  private toPayload(input: PlaceOrderInput): CreateOrderPayload {
    const form = { collector: input.collector, payment: input.payment }
    assertValid(validateCheckoutForm(form))
    const parties = toOrderParties(form)
    if (!parties) throw validationFailed({ payment: ['Revise os dados de pagamento'] })
    return { quoteId: input.quoteId, ...parties }
  }
}
