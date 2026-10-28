import { SessionState } from '@application/services/session-state'
import { AddCartItemUseCase } from '@application/use-cases/cart/add-cart-item.use-case'
import { ApplyCouponUseCase } from '@application/use-cases/cart/apply-coupon.use-case'
import { GetCartUseCase } from '@application/use-cases/cart/get-cart.use-case'
import { MergeGuestCartUseCase } from '@application/use-cases/cart/merge-guest-cart.use-case'
import { RemoveCartItemUseCase } from '@application/use-cases/cart/remove-cart-item.use-case'
import { RemoveCouponUseCase } from '@application/use-cases/cart/remove-coupon.use-case'
import { UpdateCartItemUseCase } from '@application/use-cases/cart/update-cart-item.use-case'
import { GetCatalogFacetsUseCase } from '@application/use-cases/catalog/get-catalog-facets.use-case'
import { GetNftUseCase } from '@application/use-cases/catalog/get-nft.use-case'
import { ListFeaturedNftsUseCase } from '@application/use-cases/catalog/list-featured-nfts.use-case'
import { ListNftReviewsUseCase } from '@application/use-cases/catalog/list-nft-reviews.use-case'
import { ListNftsUseCase } from '@application/use-cases/catalog/list-nfts.use-case'
import { CreateQuoteUseCase } from '@application/use-cases/checkout/create-quote.use-case'
import { GetOrderUseCase } from '@application/use-cases/checkout/get-order.use-case'
import { GetReceiptUseCase } from '@application/use-cases/checkout/get-receipt.use-case'
import { PlaceOrderUseCase } from '@application/use-cases/checkout/place-order.use-case'
import { ResumeCheckoutUseCase } from '@application/use-cases/checkout/resume-checkout.use-case'
import { RevalidateQuoteUseCase } from '@application/use-cases/checkout/revalidate-quote.use-case'
import { ListFavoritesUseCase } from '@application/use-cases/favorites/list-favorites.use-case'
import { SetFavoriteUseCase } from '@application/use-cases/favorites/set-favorite.use-case'
import { ChangePasswordUseCase } from '@application/use-cases/profile/change-password.use-case'
import { GetProfileUseCase } from '@application/use-cases/profile/get-profile.use-case'
import { UpdateAvatarUseCase } from '@application/use-cases/profile/update-avatar.use-case'
import { RemoveAvatarUseCase } from '@application/use-cases/profile/remove-avatar.use-case'
import { UpdateProfileUseCase } from '@application/use-cases/profile/update-profile.use-case'
import { RealtimeSync } from '@application/services/realtime-sync'
import { ExpireSessionUseCase } from '@application/use-cases/session/expire-session.use-case'
import { LoginUseCase } from '@application/use-cases/session/login.use-case'
import { LogoutUseCase } from '@application/use-cases/session/logout.use-case'
import { RefreshSessionUseCase } from '@application/use-cases/session/refresh-session.use-case'
import { RegisterUseCase } from '@application/use-cases/session/register.use-case'
import { RestoreSessionUseCase } from '@application/use-cases/session/restore-session.use-case'
import { ListWalletsUseCase } from '@application/use-cases/wallets/list-wallets.use-case'
import { RemoveWalletUseCase } from '@application/use-cases/wallets/remove-wallet.use-case'
import { SaveWalletUseCase } from '@application/use-cases/wallets/save-wallet.use-case'
import { SetWalletConnectionUseCase } from '@application/use-cases/wallets/set-wallet-connection.use-case'

import { createQueryClient } from '@main/query-client'
import { QueryCacheRealtimeSink } from '@main/realtime/query-cache-realtime-sink'

import { HttpProfileGateway, HttpWalletGateway } from '@adapters/http/http-account.gateway'
import { HttpAuthGateway } from '@adapters/http/http-auth.gateway'
import { HttpCartGateway } from '@adapters/http/http-cart.gateway'
import { HttpCatalogGateway } from '@adapters/http/http-catalog.gateway'
import { HttpFavoritesGateway } from '@adapters/http/http-favorites.gateway'
import { HttpOrderGateway, HttpQuoteGateway } from '@adapters/http/http-order.gateway'
import { installSessionInterceptors } from '@adapters/http/session-interceptors'
import { CryptoIdGenerator, SystemClock } from '@adapters/services/system-services'
import { SocketIoRealtimeGateway } from '@adapters/socket/socket-io-realtime.gateway'
import {
  LocalCheckoutAttemptStorage,
  LocalGuestCartStorage,
  LocalSessionStorage,
  SessionCheckoutDraftStorage,
} from '@adapters/storage/browser-storage'
import { httpClient } from '@infra/http/http-client'
import { loadSocketClient } from '@infra/socket/socket-client'

/**
 * Composition root: único ponto que instancia implementações concretas e as
 * injeta nos casos de uso. A interface acessa tudo por hooks.
 */
const createContainer = () => {
  const clock = new SystemClock()
  const ids = new CryptoIdGenerator()
  const sessionState = new SessionState()
  const sessionStorage = new LocalSessionStorage()
  const guestCartStorage = new LocalGuestCartStorage(ids)
  const checkoutAttempts = new LocalCheckoutAttemptStorage()
  const queryClient = createQueryClient()

  const auth = new HttpAuthGateway(httpClient)
  const catalog = new HttpCatalogGateway(httpClient)
  const favorites = new HttpFavoritesGateway(httpClient)
  const cart = new HttpCartGateway(httpClient, guestCartStorage, () => sessionState.current !== null)
  const quotes = new HttpQuoteGateway(httpClient)
  const orders = new HttpOrderGateway(httpClient)
  const profiles = new HttpProfileGateway(httpClient)
  const wallets = new HttpWalletGateway(httpClient)

  const refreshSession = new RefreshSessionUseCase(auth, sessionState, sessionStorage)
  const expireSession = new ExpireSessionUseCase(sessionState, sessionStorage)
  installSessionInterceptors(httpClient, {
    current: () => {
      const session = sessionState.current
      return session ? { userId: session.user.id, accessToken: session.accessToken } : null
    },
    refresh: async () => (await refreshSession.execute()).accessToken,
    onSessionInvalid: () => {
      expireSession.execute()
    },
  })

  const realtime = new RealtimeSync(
    new SocketIoRealtimeGateway(loadSocketClient),
    new QueryCacheRealtimeSink(queryClient, () => sessionState.current?.user.id ?? null),
  )

  const mergeGuestCart = new MergeGuestCartUseCase(cart, guestCartStorage)

  return {
    clock,
    queryClient,
    sessionState,
    realtime,
    session: {
      login: new LoginUseCase(auth, sessionState, sessionStorage, mergeGuestCart),
      register: new RegisterUseCase(auth, sessionState, sessionStorage, mergeGuestCart),
      logout: new LogoutUseCase(auth, sessionState, sessionStorage),
      restore: new RestoreSessionUseCase(sessionState, sessionStorage, clock),
      refresh: refreshSession,
    },
    catalog: {
      list: new ListNftsUseCase(catalog),
      featured: new ListFeaturedNftsUseCase(catalog),
      facets: new GetCatalogFacetsUseCase(catalog),
      detail: new GetNftUseCase(catalog),
      reviews: new ListNftReviewsUseCase(catalog),
    },
    favorites: {
      list: new ListFavoritesUseCase(favorites, sessionState),
      set: new SetFavoriteUseCase(favorites, sessionState),
    },
    cart: {
      get: new GetCartUseCase(cart, sessionState, guestCartStorage, mergeGuestCart),
      addItem: new AddCartItemUseCase(cart),
      updateItem: new UpdateCartItemUseCase(cart),
      removeItem: new RemoveCartItemUseCase(cart),
      applyCoupon: new ApplyCouponUseCase(cart),
      removeCoupon: new RemoveCouponUseCase(cart),
    },
    checkout: {
      draft: new SessionCheckoutDraftStorage(),
      createQuote: new CreateQuoteUseCase(quotes, sessionState),
      revalidateQuote: new RevalidateQuoteUseCase(quotes, sessionState),
      placeOrder: new PlaceOrderUseCase(orders, checkoutAttempts, sessionState, ids, clock),
      resume: new ResumeCheckoutUseCase(orders, checkoutAttempts, sessionState),
      getOrder: new GetOrderUseCase(orders, sessionState),
      getReceipt: new GetReceiptUseCase(orders, sessionState),
    },
    profile: {
      get: new GetProfileUseCase(profiles, sessionState),
      update: new UpdateProfileUseCase(profiles, sessionState, sessionStorage),
      updateAvatar: new UpdateAvatarUseCase(profiles, sessionState, sessionStorage),
      removeAvatar: new RemoveAvatarUseCase(profiles, sessionState, sessionStorage),
      changePassword: new ChangePasswordUseCase(profiles, sessionState),
    },
    wallets: {
      list: new ListWalletsUseCase(wallets, sessionState),
      save: new SaveWalletUseCase(wallets, sessionState),
      remove: new RemoveWalletUseCase(wallets, sessionState),
      setConnection: new SetWalletConnectionUseCase(wallets, sessionState),
    },
  }
}

export type AppContainer = ReturnType<typeof createContainer>

export const container: AppContainer = createContainer()
