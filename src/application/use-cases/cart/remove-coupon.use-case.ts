import type { Cart } from '@domain/entities/cart'

import type { CartGateway } from '@application/ports/gateways/cart.gateway'

export class RemoveCouponUseCase {
  private readonly cart: CartGateway

  constructor(cart: CartGateway) {
    this.cart = cart
  }

  execute(): Promise<Cart> {
    return this.cart.removeCoupon()
  }
}
