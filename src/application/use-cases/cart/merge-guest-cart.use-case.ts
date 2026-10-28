import type { CartGateway } from '@application/ports/gateways/cart.gateway'
import type { GuestCartStorage } from '@application/ports/services/guest-cart-storage'

/**
 * Leva os itens do visitante para o carrinho do usuário que acabou de entrar.
 * Falha não derruba o login: o id do visitante fica guardado e a mescla é
 * tentada de novo na próxima leitura do carrinho.
 */
export class MergeGuestCartUseCase {
  private readonly cart: CartGateway
  private readonly guestCart: GuestCartStorage

  constructor(cart: CartGateway, guestCart: GuestCartStorage) {
    this.cart = cart
    this.guestCart = guestCart
  }

  async execute(): Promise<boolean> {
    const guestCartId = this.guestCart.load()
    if (!guestCartId) return false
    try {
      await this.cart.mergeGuestCart(guestCartId)
      this.guestCart.clear()
      return true
    } catch {
      return false
    }
  }
}
