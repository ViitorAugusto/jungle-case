import type { Order } from '@domain/entities/order'
import type { Receipt } from '@domain/entities/receipt'
import type { OrderCollector, OrderPayment } from '@domain/entities/checkout-form'

import type { RequestOptions } from '@application/ports/gateways/catalog.gateway'

export type CreateOrderPayload = {
  readonly quoteId: string
  readonly collector: OrderCollector
  readonly payment: OrderPayment
}

export interface OrderGateway {
  /** Mesma chave + mesmo conteúdo devolve o mesmo pedido; conteúdo diferente → CONFLICT. */
  create(payload: CreateOrderPayload, idempotencyKey: string): Promise<Order>
  findById(id: string, options?: RequestOptions): Promise<Order>
  receipt(orderId: string, options?: RequestOptions): Promise<Receipt>
}
