import type { Cart } from '@domain/entities/cart'
import { Quantity } from '@domain/value-objects/quantity'

import type { AddCartItemInput } from '@application/dtos/inputs'
import { toValidationError } from '@application/errors/validation'
import type { CartGateway } from '@application/ports/gateways/cart.gateway'

export class AddCartItemUseCase {
  private readonly cart: CartGateway

  constructor(cart: CartGateway) {
    this.cart = cart
  }

  async execute(input: AddCartItemInput): Promise<Cart> {
    try {
      const quantity =
        input.available === undefined
          ? Quantity.of(input.quantity)
          : Quantity.within(input.quantity, input.available)
      return await this.cart.addItem({
        nftId: input.nftId,
        editionId: input.editionId,
        quantity: quantity.value,
      })
    } catch (error) {
      throw toValidationError(error)
    }
  }
}
