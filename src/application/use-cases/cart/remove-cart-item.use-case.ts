import type { Cart } from '@domain/entities/cart'

import type { CartGateway } from '@application/ports/gateways/cart.gateway'

export class RemoveCartItemUseCase {
  private readonly cart: CartGateway

  constructor(cart: CartGateway) {
    this.cart = cart
  }

  execute(lineId: string): Promise<Cart> {
    return this.cart.removeItem(lineId)
  }
}
