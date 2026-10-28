/**
 * Tipos que cruzam a fronteira aplicação → interface. A apresentação importa
 * daqui (nunca de `domain/` diretamente).
 */
export type { Cart, CartChange, CartLine } from '@domain/entities/cart'
export type { Favorite } from '@domain/entities/favorite'
export type { Nft, NftCollection, NftCreator, NftEdition, NftImage, NftNetwork } from '@domain/entities/nft'
export { nftNetworks } from '@domain/entities/nft'
export type {
  Order,
  OrderCollector,
  OrderLine,
  OrderPayment,
  OrderStatus,
  OrderTransaction,
} from '@domain/entities/order'
export type { AppliedCoupon, CouponKind, PriceSummary } from '@domain/entities/pricing'
export type { Profile, ProfileDraft } from '@domain/entities/profile'
export type { Quote, QuoteChange, QuoteLine } from '@domain/entities/quote'
export type { Receipt } from '@domain/entities/receipt'
export type { Session, User } from '@domain/entities/session'
export type { Network, Wallet, WalletDraft, WalletSlot } from '@domain/entities/wallet'
export { networks, walletSlots } from '@domain/entities/wallet'
export {
  findEdition,
  isEditionAvailable,
  isNewerVersion,
  isSoldOut,
  lowestPriceEth,
} from '@domain/entities/nft'
export { diffCart, linesOverAvailability } from '@domain/entities/cart'
export { isConfirmed, isTerminalStatus, reconcileOrder } from '@domain/entities/order'
export { isQuoteOutdated } from '@domain/entities/quote'
export {
  AVATAR_MAX_BYTES,
  AVATAR_MIME_TYPES,
  PASSWORD_MIN_LENGTH,
  validateAvatar,
  validatePasswordChange,
  validateProfileDraft,
  validateRegistration,
} from '@domain/entities/profile'
export {
  copyPrimaryWalletProfile,
  emptyWalletDraft,
  toWalletDraft,
  walletDraftErrors as validateWalletDraft,
} from '@domain/entities/wallet'
export type { CheckoutFormValues, WalletProvider } from '@domain/entities/checkout-form'
export {
  emptyCheckoutForm,
  isWalletProvider,
  ORDER_NOTE_MAX_LENGTH,
  prefillCheckoutForm,
  validateCheckoutForm,
  walletProviderLabels,
  walletProviders,
} from '@domain/entities/checkout-form'
export { receiptWalletLabel } from '@domain/entities/receipt'

export * from '@application/dtos/catalog'
export * from '@application/dtos/catalog-search'
export * from '@application/dtos/inputs'

export type { RealtimeStatus } from '@application/ports/gateways/realtime.gateway'
export {
  ApplicationError,
  applicationErrorCodes,
  isApplicationError,
  type ApplicationErrorCode,
  type FieldErrors,
} from '@application/errors/application-error'
export { errorReasons, hasReason, type ErrorReason } from '@application/errors/error-reasons'
export * from '@application/dtos/auth-search'
export type { CheckoutDraft } from '@application/ports/services/checkout-draft-storage'
