import type { Cart } from '@domain/entities/cart'
import { Quantity } from '@domain/value-objects/quantity'

import type { UpdateCartItemInput } from '@application/dtos/inputs'
import { toValidationError } from '@application/errors/validation'
import type { CartGateway } from '@application/ports/gateways/cart.gateway'

export class UpdateCartItemUseCase {
  private readonly cart: CartGateway

  constructor(cart: CartGateway) {
    this.cart = cart
  }

  async execute(input: UpdateCartItemInput): Promise<Cart> {
    try {
      const quantity =
        input.available === undefined
          ? Quantity.of(input.quantity)
          : Quantity.within(input.quantity, input.available)
      return await this.cart.updateItem(input.lineId, quantity.value)
    } catch (error) {
      throw toValidationError(error)
    }
  }
}
