/**
 * Motivos de negócio (`ApplicationError.reason`) que a API pode enviar. A
 * interface usa para escolher mensagem ou ação (ex.: levar ao login).
 */
export const errorReasons = [
  'INVALID_CREDENTIALS',
  'EMAIL_IN_USE',
  'USERNAME_IN_USE',
  'TOKEN_EXPIRED',
  'SESSION_EXPIRED',
  'UNAUTHENTICATED',
  'FORBIDDEN',
  'NFT_NOT_FOUND',
  'EDITION_NOT_FOUND',
  'EDITION_SOLD_OUT',
  'QUANTITY_EXCEEDS_AVAILABILITY',
  'INVALID_QUANTITY',
  'CART_EMPTY',
  'COUPON_INVALID',
  'COUPON_EXPIRED',
  'QUOTE_NOT_FOUND',
  'QUOTE_EXPIRED',
  'QUOTE_OUTDATED',
  'IDEMPOTENCY_KEY_REQUIRED',
  'IDEMPOTENCY_KEY_REUSED',
  'ORDER_NOT_FOUND',
  'ORDER_NOT_CONFIRMED',
  'WALLET_NOT_FOUND',
  'WALLET_REJECTED',
  'CURRENT_PASSWORD_INVALID',
  'VALIDATION_FAILED',
  'SERVICE_UNAVAILABLE',
] as const

export type ErrorReason = (typeof errorReasons)[number]

export const hasReason = (error: { readonly reason: string | undefined }, reason: ErrorReason) =>
  error.reason === reason
