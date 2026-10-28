import type { Cart } from '@domain/entities/cart'

import type { CartGateway } from '@application/ports/gateways/cart.gateway'
import type { RequestOptions } from '@application/ports/gateways/catalog.gateway'
import type { GuestCartStorage } from '@application/ports/services/guest-cart-storage'
import type { SessionState } from '@application/services/session-state'
import type { MergeGuestCartUseCase } from '@application/use-cases/cart/merge-guest-cart.use-case'

export class GetCartUseCase {
  private readonly cart: CartGateway
  private readonly session: SessionState
  private readonly guestCart: GuestCartStorage
  private readonly mergeGuestCart: MergeGuestCartUseCase

  constructor(
    cart: CartGateway,
    session: SessionState,
    guestCart: GuestCartStorage,
    mergeGuestCart: MergeGuestCartUseCase,
  ) {
    this.cart = cart
    this.session = session
    this.guestCart = guestCart
    this.mergeGuestCart = mergeGuestCart
  }

  async execute(options?: RequestOptions): Promise<Cart> {
    // Mescla pendente (falhou no login): tenta de novo antes de ler o carrinho do usuário.
    if (this.session.current && this.guestCart.load()) await this.mergeGuestCart.execute()
    return this.cart.get(options)
  }
}
