import type { Cart } from '@domain/entities/cart'

import type { RequestOptions } from '@application/ports/gateways/catalog.gateway'

/**
 * Carrinho no servidor. Visitante é identificado pelo id de carrinho de
 * visitante; usuário autenticado, pela sessão. O adaptador decide qual enviar.
 */
export interface CartGateway {
  get(options?: RequestOptions): Promise<Cart>
  addItem(input: { nftId: string; editionId: string; quantity: number }): Promise<Cart>
  updateItem(lineId: string, quantity: number): Promise<Cart>
  removeItem(lineId: string): Promise<Cart>
  applyCoupon(code: string): Promise<Cart>
  removeCoupon(): Promise<Cart>
  /** Move os itens do carrinho de visitante para o carrinho do usuário autenticado. */
  mergeGuestCart(guestCartId: string): Promise<Cart>
}
