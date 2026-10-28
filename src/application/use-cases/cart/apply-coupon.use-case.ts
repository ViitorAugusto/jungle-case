import type { Cart } from '@domain/entities/cart'

import { assertValid } from '@application/errors/validation'
import type { CartGateway } from '@application/ports/gateways/cart.gateway'

const COUPON_PATTERN = /^[A-Z0-9-]{3,20}$/

export class ApplyCouponUseCase {
  private readonly cart: CartGateway

  constructor(cart: CartGateway) {
    this.cart = cart
  }

  execute(rawCode: string): Promise<Cart> {
    const code = rawCode.trim().toUpperCase()
    assertValid(COUPON_PATTERN.test(code) ? {} : { code: ['Informe um código de cupom válido'] })
    return this.cart.applyCoupon(code)
  }
}
