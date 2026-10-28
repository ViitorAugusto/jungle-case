import { isConfirmed } from '@domain/entities/order'
import type { Receipt } from '@domain/entities/receipt'

import { ApplicationError } from '@application/errors/application-error'
import type { RequestOptions } from '@application/ports/gateways/catalog.gateway'
import type { OrderGateway } from '@application/ports/gateways/order.gateway'
import type { SessionState } from '@application/services/session-state'
import { requireSession } from '@application/services/require-session'

/**
 * Recibo só existe para pedido que a simulação confirmou. A verificação é
 * feita aqui e de novo no servidor: nenhuma tela de confirmação nasce de
 * pedido pendente ou recusado.
 */
export class GetReceiptUseCase {
  private readonly orders: OrderGateway
  private readonly session: SessionState

  constructor(orders: OrderGateway, session: SessionState) {
    this.orders = orders
    this.session = session
  }

  async execute(orderId: string, options?: RequestOptions): Promise<Receipt> {
    requireSession(this.session)
    const order = await this.orders.findById(orderId, options)
    if (!isConfirmed(order)) {
      throw new ApplicationError('CONFLICT', 'O pagamento deste pedido ainda não foi confirmado', {
        status: 409,
        reason: 'ORDER_NOT_CONFIRMED',
      })
    }
    return this.orders.receipt(orderId, options)
  }
}
