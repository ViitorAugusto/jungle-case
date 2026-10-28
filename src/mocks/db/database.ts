import type { NftDto, OrderDto, QuoteDto, ReceiptDto, WalletDto } from '@adapters/http/contracts'

import { createFixtureNfts, fixtureUsers, type UserRecord } from '@mocks/db/fixtures'

export type SessionRecord = {
  id: string
  userId: string
  /** Todos os tokens de acesso emitidos na sessão (o socket aceita qualquer um enquanto a sessão vive). */
  accessTokens: string[]
  currentAccessToken: string
  refreshToken: string
  accessExpiresAt: string
  refreshExpiresAt: string
  createdAt: string
  revoked: boolean
}

export type CartLineRecord = { nftId: string; editionId: string; quantity: number }

export type CartRecord = {
  /** `user:<id>` ou `guest:<id>`. */
  owner: string
  lines: CartLineRecord[]
  couponCode: string | null
  version: number
}

export type QuoteRecord = {
  userId: string
  quote: QuoteDto
  /** Impressão digital de preços, quantidades, cupom e taxa no momento da cotação. */
  fingerprint: string
  superseded: boolean
}

export type OrderRecord = {
  userId: string
  order: OrderDto
  receipt: ReceiptDto | null
  /** Quando a simulação de pagamento resolve o pedido. */
  settleAt: string
  outcome: 'confirm' | 'reject'
}

export type IdempotencyRecord = { userId: string; key: string; fingerprint: string; orderId: string }
export type FavoriteRecord = { userId: string; nftId: string; createdAt: string }
export type WalletRecord = { userId: string; wallet: WalletDto }

export type DbState = {
  /** Sobe quando o formato das fixtures muda: estado salvo de versão anterior é descartado. */
  schema: 5
  seq: { order: number; quote: number; event: number }
  users: UserRecord[]
  sessions: SessionRecord[]
  nfts: NftDto[]
  favorites: FavoriteRecord[]
  carts: CartRecord[]
  quotes: QuoteRecord[]
  orders: OrderRecord[]
  idempotency: IdempotencyRecord[]
  wallets: WalletRecord[]
}

const STORAGE_KEY = 'nft-market:mock-db'

const fixtureWallets = (): WalletRecord[] => [
  {
    userId: 'usr_alex',
    wallet: {
      slot: 'primary',
      nickname: 'Cofre do Alex',
      displayName: 'Alex Rocha',
      profileName: 'Alex Rocha',
      email: 'alex@jungle.test',
      ensName: 'alexrocha.eth',
      referralCode: 'JNG-2026',
      network: 'ethereum',
      address: '0x1111111111111111111111111111111111111111',
      secondaryAddressOrEns: null,
      provider: 'metamask',
      connected: false,
      updatedAt: '2026-01-10T12:00:00.000Z',
    },
  },
]

const initialState = (): DbState => ({
  schema: 5,
  seq: { order: 0, quote: 0, event: 0 },
  users: fixtureUsers.map((user) => ({ ...user })),
  sessions: [],
  nfts: createFixtureNfts(),
  favorites: [],
  carts: [],
  quotes: [],
  orders: [],
  idempotency: [],
  wallets: fixtureWallets(),
})

const load = (): DbState => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<DbState>
      if (parsed.schema === 5) return parsed as DbState
    }
  } catch {
    // Estado corrompido ou armazenamento bloqueado: volta ao cenário conhecido.
  }
  return initialState()
}

/**
 * Estado único do servidor simulado, compartilhado por catálogo, favoritos,
 * carrinho, perfil, carteiras e pedidos. Persistido no `localStorage` para
 * sobreviver a refresh; `reset` restaura as fixtures.
 */
export const db = {
  state: load(),

  commit(): void {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state))
    } catch {
      // Sem persistência o estado segue válido em memória.
    }
  },

  reset(): void {
    this.state = initialState()
    this.commit()
  },

  nextId(kind: keyof DbState['seq'], prefix: string): string {
    this.state.seq[kind] += 1
    return `${prefix}_${String(this.state.seq[kind]).padStart(4, '0')}`
  },

  findNft(id: string): NftDto | undefined {
    return this.state.nfts.find((nft) => nft.id === id)
  },

  /** Substitui o NFT incrementando a versão (toda mudança gera versão nova). */
  updateNft(id: string, change: (nft: NftDto) => NftDto): NftDto | undefined {
    const index = this.state.nfts.findIndex((nft) => nft.id === id)
    const current = this.state.nfts[index]
    if (!current) return undefined
    const next = { ...change(current), version: current.version + 1 }
    this.state.nfts[index] = next
    return next
  },

  findUser(id: string): UserRecord | undefined {
    return this.state.users.find((user) => user.id === id)
  },

  cart(owner: string): CartRecord {
    let cart = this.state.carts.find((item) => item.owner === owner)
    if (!cart) {
      cart = { owner, lines: [], couponCode: null, version: 0 }
      this.state.carts.push(cart)
    }
    return cart
  },

  findOrder(id: string): OrderRecord | undefined {
    return this.state.orders.find((record) => record.order.id === id)
  },
}
