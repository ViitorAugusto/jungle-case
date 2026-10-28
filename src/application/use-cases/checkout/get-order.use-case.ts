import type { Order } from '@domain/entities/order'

import type { RequestOptions } from '@application/ports/gateways/catalog.gateway'
import type { OrderGateway } from '@application/ports/gateways/order.gateway'
import type { SessionState } from '@application/services/session-state'
import { requireSession } from '@application/services/require-session'

export class GetOrderUseCase {
  private readonly orders: OrderGateway
  private readonly session: SessionState

  constructor(orders: OrderGateway, session: SessionState) {
    this.orders = orders
    this.session = session
  }

  execute(orderId: string, options?: RequestOptions): Promise<Order> {
    requireSession(this.session)
    return this.orders.findById(orderId, options)
  }
}
