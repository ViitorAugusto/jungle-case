import type { AxiosInstance, AxiosRequestConfig } from 'axios'

import type { Cart } from '@domain/entities/cart'

import type { CartGateway } from '@application/ports/gateways/cart.gateway'
import type { RequestOptions } from '@application/ports/gateways/catalog.gateway'
import type { GuestCartStorage } from '@application/ports/services/guest-cart-storage'

import {
  apiRoutes,
  GUEST_CART_HEADER,
  type AddCartItemRequest,
  type ApplyCouponRequest,
  type CartDto,
  type MergeCartRequest,
  type UpdateCartItemRequest,
} from '@adapters/http/contracts'
import { toCart } from '@adapters/mappers/api.mapper'

/**
 * Carrinho do usuário (pela sessão) ou do visitante (pelo cabeçalho
 * `X-Guest-Cart-Id`). O id de visitante só é criado na primeira escrita.
 */
export class HttpCartGateway implements CartGateway {
  private readonly http: AxiosInstance
  private readonly guestCart: GuestCartStorage
  private readonly isAuthenticated: () => boolean

  constructor(http: AxiosInstance, guestCart: GuestCartStorage, isAuthenticated: () => boolean) {
    this.http = http
    this.guestCart = guestCart
    this.isAuthenticated = isAuthenticated
  }

  async get(options: RequestOptions = {}): Promise<Cart> {
    const { data } = await this.http.get<CartDto>(apiRoutes.cart, { ...this.owner(false), ...options })
    return toCart(data)
  }

  async addItem(input: AddCartItemRequest): Promise<Cart> {
    const { data } = await this.http.post<CartDto>(apiRoutes.cartItems, input, this.owner(true))
    return toCart(data)
  }

  async updateItem(lineId: string, quantity: number): Promise<Cart> {
    const body: UpdateCartItemRequest = { quantity }
    const { data } = await this.http.patch<CartDto>(apiRoutes.cartItem(lineId), body, this.owner(true))
    return toCart(data)
  }

  async removeItem(lineId: string): Promise<Cart> {
    const { data } = await this.http.delete<CartDto>(apiRoutes.cartItem(lineId), this.owner(true))
    return toCart(data)
  }

  async applyCoupon(code: string): Promise<Cart> {
    const body: ApplyCouponRequest = { code }
    const { data } = await this.http.put<CartDto>(apiRoutes.cartCoupon, body, this.owner(true))
    return toCart(data)
  }

  async removeCoupon(): Promise<Cart> {
    const { data } = await this.http.delete<CartDto>(apiRoutes.cartCoupon, this.owner(true))
    return toCart(data)
  }

  async mergeGuestCart(guestCartId: string): Promise<Cart> {
    const body: MergeCartRequest = { guestCartId }
    const { data } = await this.http.post<CartDto>(apiRoutes.cartMerge, body)
    return toCart(data)
  }

  private owner(createGuest: boolean): AxiosRequestConfig {
    if (this.isAuthenticated()) return {}
    const guestCartId = createGuest ? this.guestCart.getOrCreate() : this.guestCart.load()
    return guestCartId ? { headers: { [GUEST_CART_HEADER]: guestCartId } } : {}
  }
}
