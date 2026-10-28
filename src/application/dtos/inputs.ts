import type { CheckoutFormValues } from '@domain/entities/checkout-form'
import type { ProfileDraft } from '@domain/entities/profile'
import type { WalletDraft, WalletSlot } from '@domain/entities/wallet'

export type LoginInput = {
  readonly email: string
  readonly password: string
}

export type RegisterInput = {
  readonly name: string
  readonly email: string
  readonly password: string
  /** Confirmação digitada no formulário; validada aqui e nunca enviada à API. */
  readonly confirmPassword?: string
}

export type AddCartItemInput = {
  readonly nftId: string
  readonly editionId: string
  readonly quantity: number
  /** Estoque conhecido pela interface; a API valida de novo. */
  readonly available?: number
}

export type UpdateCartItemInput = {
  readonly lineId: string
  readonly quantity: number
  readonly available?: number
}

/** Pedido a partir do formulário de pagamento (valores como digitados; o caso de uso valida). */
export type PlaceOrderInput = CheckoutFormValues & {
  readonly quoteId: string
}

/** Formulário "Perfil do colecionador" (valores como digitados; o caso de uso valida). */
export type ProfileInput = ProfileDraft

export type PasswordChangeInput = {
  readonly currentPassword: string
  readonly newPassword: string
}

export type AvatarInput = {
  /** Imagem codificada em data URL (`data:image/png;base64,...`). */
  readonly dataUrl: string
  readonly type: string
  readonly size: number
}

/** Formulário de carteira (mesmos campos do pagamento), como digitado. */
export type WalletInput = WalletDraft & {
  readonly slot: WalletSlot
}

/** Conectar pelo provedor (MetaMask, WalletConnect, Coinbase) ou desconectar, na simulação. */
export type SetWalletConnectionInput =
  | { readonly slot: WalletSlot; readonly connected: true; readonly provider: string }
  | { readonly slot: WalletSlot; readonly connected: false }
