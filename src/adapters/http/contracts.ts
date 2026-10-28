/**
 * Contrato REST (formato de transporte). Fonte única para os adaptadores HTTP
 * e para o servidor simulado (MSW). Valores ETH são sempre string decimal.
 * Documentação: ARCHITECTURE.md, seção "Contratos REST".
 */

export type ApiErrorBody = {
  readonly message: string
  /** Código de negócio estável (ex.: `COUPON_EXPIRED`, `EDITION_SOLD_OUT`). */
  readonly reason?: string
  readonly fieldErrors?: Readonly<Record<string, readonly string[]>>
}

// ---------- Sessão e conta ----------

export type UserDto = {
  readonly id: string
  readonly name: string
  readonly email: string
  readonly avatarUrl: string | null
}

export type SessionDto = {
  readonly user: UserDto
  readonly accessToken: string
  readonly refreshToken: string
  readonly accessExpiresAt: string
  readonly refreshExpiresAt: string
}

export type LoginRequest = { readonly email: string; readonly password: string }
export type RegisterRequest = { readonly name: string; readonly email: string; readonly password: string }
export type RefreshRequest = { readonly refreshToken: string }

// ---------- NFTs ----------

export type NftEditionDto = {
  readonly id: string
  readonly name: string
  readonly priceEth: string
  /** Preço anterior (riscado) quando houve redução; `null` sem promoção. */
  readonly compareAtPriceEth: string | null
  /** Tiragem (o "50" de "1/50"); `null` = edição aberta, sem tiragem máxima. */
  readonly supply: number | null
  /** Estoque à venda agora (também na edição aberta). */
  readonly available: number
}

export type NftRarityDto = 'comum' | 'raro'

export type NftDto = {
  readonly id: string
  readonly name: string
  /** "ID do token" (ex.: `#0042`). */
  readonly tokenId: string
  /** Texto curto de "Sobre este NFT". */
  readonly summary: string
  /** Texto da aba "Detalhes do NFT"; parágrafos separados por linha em branco. */
  readonly description: string
  /** Categoria do filtro "Coleções" (base de `collection=` e de "Mais desta coleção"). */
  readonly collection: { readonly id: string; readonly name: string }
  /** Série do contrato exibida em "Coleção:" nos metadados (ex.: Kurio Apes). */
  readonly series: { readonly id: string; readonly name: string }
  readonly network: NetworkDto
  readonly creator: { readonly name: string; readonly avatarUrl: string }
  /** Atributos do token ("Atributos: Óculos, Esmeralda, Raro"). */
  readonly attributes: readonly string[]
  /** Selo do card: `raro` exibe "RARO". */
  readonly rarity: NftRarityDto
  /** Avaliações de colecionadores: média de 0 a 5 com 1 casa e quantidade. */
  readonly rating: { readonly average: number; readonly count: number }
  /** Rede, contrato e direitos autorais da aba "Detalhes do NFT". */
  readonly provenance: {
    readonly contractAddress: string
    readonly tokenStandard: string
    readonly metadataStorage: string
    /** Direitos autorais do criador nas vendas secundárias, em %. */
    readonly royaltyPercent: number
  }
  readonly images: readonly { readonly url: string; readonly alt: string }[]
  readonly editions: readonly NftEditionDto[]
  readonly featured: boolean
  /** 0–100; base da aba "em-alta". */
  readonly trendingScore: number
  readonly createdAt: string
  readonly version: number
}

/** Avaliação de colecionador (aba "Avaliações de colecionadores (N)"). */
export type NftReviewDto = {
  readonly id: string
  readonly author: { readonly name: string; readonly avatarUrl: string }
  /** Nota inteira de 1 a 5. */
  readonly rating: number
  readonly comment: string
  readonly createdAt: string
}

/** `GET /nfts/:id/reviews`: mais recentes primeiro; `total` = `rating.count` do NFT. */
export type NftReviewsDto = { readonly items: readonly NftReviewDto[]; readonly total: number }

export type PageDto<T> = {
  readonly items: readonly T[]
  readonly page: number
  readonly pageSize: number
  readonly total: number
  readonly totalPages: number
}

export type FacetOptionDto = { readonly id: string; readonly label: string; readonly count: number }

export type CatalogFacetsDto = {
  readonly collections: readonly FacetOptionDto[]
  readonly networks: readonly FacetOptionDto[]
  readonly priceRange: { readonly minEth: string; readonly maxEth: string }
}

/**
 * Query string de `GET /nfts`. Listas repetem a chave (`collection=a&collection=b`,
 * `network=ethereum&network=solana`). `tab`: todos | novos | em-alta. `sort` ausente =
 * padrão da aba (recentes; em-alta por tendência).
 */
export const catalogQueryParams = {
  search: 'search',
  collection: 'collection',
  network: 'network',
  minPrice: 'minPrice',
  maxPrice: 'maxPrice',
  tab: 'tab',
  sort: 'sort',
  page: 'page',
  pageSize: 'pageSize',
  featured: 'featured',
} as const

// ---------- Favoritos ----------

export type FavoriteDto = { readonly nftId: string; readonly createdAt: string; readonly nft: NftDto }
export type FavoritesDto = { readonly items: readonly FavoriteDto[] }

// ---------- Carrinho e cotação ----------

export type PriceSummaryDto = {
  readonly subtotalEth: string
  readonly discountEth: string
  readonly networkFeeEth: string
  readonly totalEth: string
}

export type CouponDto = {
  readonly code: string
  readonly kind: 'percentage' | 'fixed'
  readonly value: string
  readonly description: string
}

export type CartLineDto = {
  readonly id: string
  readonly nftId: string
  readonly editionId: string
  /** "ID do token" (ex.: `#0042`). */
  readonly tokenId: string
  readonly nftName: string
  readonly editionName: string
  /** Tiragem da edição (`null` = aberta), exibida como "1/50" ou "ABERTA". */
  readonly editionSupply: number | null
  readonly imageUrl: string
  readonly unitPriceEth: string
  readonly quantity: number
  readonly available: number
  readonly lineTotalEth: string
}

export type CartDto = {
  readonly owner: 'guest' | 'user'
  readonly lines: readonly CartLineDto[]
  readonly coupon: CouponDto | null
  readonly summary: PriceSummaryDto
  /** Itens distintos (linhas), base do badge do carrinho. */
  readonly itemCount: number
  readonly version: number
}

export type AddCartItemRequest = {
  readonly nftId: string
  readonly editionId: string
  readonly quantity: number
}
export type UpdateCartItemRequest = { readonly quantity: number }
export type ApplyCouponRequest = { readonly code: string }
export type MergeCartRequest = { readonly guestCartId: string }

export type QuoteLineDto = Omit<CartLineDto, 'id'>

export type QuoteDto = {
  readonly id: string
  readonly lines: readonly QuoteLineDto[]
  readonly coupon: CouponDto | null
  readonly summary: PriceSummaryDto
  readonly createdAt: string
  readonly expiresAt: string
}

// ---------- Pedidos ----------

export type NetworkDto = 'ethereum' | 'polygon' | 'solana'
export type WalletSlotDto = 'primary' | 'secondary'

export type WalletProviderDto = 'metamask' | 'walletconnect' | 'coinbase'

/** Colecionador no formulário de pagamento do Figma. */
export type CollectorDto = {
  readonly displayName: string
  readonly username: string
  readonly profileName: string
  readonly email: string
  /** Nome ENS (`algo.eth`). */
  readonly ensName: string
  /** 3 letras maiúsculas, hífen e 4 dígitos (ex.: `JNG-2026`). */
  readonly referralCode: string
  readonly note: string | null
}

/** Carteira, rede e provedor usados no pagamento. */
export type PaymentDto = {
  readonly network: NetworkDto
  readonly address: string
  readonly secondaryAddressOrEns: string | null
  readonly provider: WalletProviderDto
  /** Carteira cadastrada usada (`primary`/`secondary`), quando houver. */
  readonly walletId: string | null
}

export type CreateOrderRequest = {
  readonly quoteId: string
  readonly collector: CollectorDto
  readonly payment: PaymentDto
}

export type OrderLineDto = Omit<CartLineDto, 'id' | 'available'>

export type OrderDto = {
  readonly id: string
  readonly status: 'pending' | 'confirmed' | 'rejected'
  readonly version: number
  readonly lines: readonly OrderLineDto[]
  readonly coupon: CouponDto | null
  readonly summary: PriceSummaryDto
  readonly collector: CollectorDto
  readonly payment: PaymentDto
  readonly transaction: { readonly hash: string; readonly explorerUrl: string } | null
  readonly rejectionReason: string | null
  readonly createdAt: string
  readonly updatedAt: string
}

export type ReceiptDto = {
  readonly orderId: string
  readonly issuedAt: string
  readonly transaction: { readonly hash: string; readonly explorerUrl: string }
  readonly lines: readonly OrderLineDto[]
  readonly coupon: CouponDto | null
  readonly summary: PriceSummaryDto
  readonly collector: CollectorDto
  readonly payment: PaymentDto
}

export const IDEMPOTENCY_KEY_HEADER = 'Idempotency-Key'
export const IDEMPOTENT_REPLAY_HEADER = 'Idempotent-Replayed'
export const GUEST_CART_HEADER = 'X-Guest-Cart-Id'

// ---------- Perfil e carteiras ----------

/** Perfil do colecionador. `ensName` e `walletNickname` ficam vazios até serem informados. */
export type ProfileDto = {
  readonly id: string
  readonly displayName: string
  readonly username: string
  readonly email: string
  readonly ensName: string
  readonly walletNickname: string
  readonly avatarUrl: string | null
  readonly updatedAt: string
}

export type UpdateProfileRequest = {
  readonly displayName: string
  readonly username: string
  readonly email: string
  readonly ensName: string
  readonly walletNickname: string
}
export type UpdateAvatarRequest = { readonly dataUrl: string }
export type ChangePasswordRequest = { readonly currentPassword: string; readonly newPassword: string }

/** Campos do formulário de carteira (os mesmos do pagamento). */
export type SaveWalletRequest = {
  readonly nickname: string
  readonly displayName: string
  readonly profileName: string
  readonly email: string
  readonly ensName: string
  readonly referralCode: string
  readonly network: NetworkDto
  readonly address: string
  readonly secondaryAddressOrEns: string | null
  /** "Tipo de carteira". */
  readonly provider: WalletProviderDto
}

export type WalletDto = SaveWalletRequest & {
  readonly slot: WalletSlotDto
  /** Conexão simulada ativa pelo `provider`. */
  readonly connected: boolean
  readonly updatedAt: string
}

/** Conecta pelo provedor escolhido; ele passa a ser o tipo da carteira. */
export type ConnectWalletRequest = { readonly provider: WalletProviderDto }

export type WalletsDto = { readonly items: readonly WalletDto[] }

/** Rotas relativas à base `VITE_API_BASE_URL`. */
export const apiRoutes = {
  register: '/auth/register',
  login: '/auth/login',
  refresh: '/auth/refresh',
  logout: '/auth/logout',
  me: '/auth/me',
  nfts: '/nfts',
  nftFacets: '/nfts/facets',
  nft: (id: string) => `/nfts/${encodeURIComponent(id)}`,
  nftReviews: (id: string) => `/nfts/${encodeURIComponent(id)}/reviews`,
  favorites: '/favorites',
  favorite: (nftId: string) => `/favorites/${encodeURIComponent(nftId)}`,
  cart: '/cart',
  cartItems: '/cart/items',
  cartItem: (lineId: string) => `/cart/items/${encodeURIComponent(lineId)}`,
  cartCoupon: '/cart/coupon',
  cartMerge: '/cart/merge',
  quotes: '/quotes',
  orders: '/orders',
  order: (id: string) => `/orders/${encodeURIComponent(id)}`,
  receipt: (id: string) => `/orders/${encodeURIComponent(id)}/receipt`,
  profile: '/profile',
  avatar: '/profile/avatar',
  password: '/profile/password',
  wallets: '/wallets',
  wallet: (slot: string) => `/wallets/${slot}`,
  walletConnect: (slot: string) => `/wallets/${slot}/connect`,
  walletDisconnect: (slot: string) => `/wallets/${slot}/disconnect`,
} as const
