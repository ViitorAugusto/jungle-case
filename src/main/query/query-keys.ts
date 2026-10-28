import type { CatalogQuery } from '@application/dtos/catalog'

/**
 * Chaves do TanStack Query. Dados públicos ficam sob `catalog`; tudo que é de
 * um usuário fica sob `['private', userId]`, o que isola usuários e permite
 * remover o cache privado inteiro de uma vez no logout/troca de conta.
 */
export const queryKeys = {
  catalog: ['catalog'] as const,
  catalogLists: ['catalog', 'list'] as const,
  catalogList: (query: CatalogQuery) => ['catalog', 'list', query] as const,
  featured: ['catalog', 'featured'] as const,
  facets: ['catalog', 'facets'] as const,
  nft: (id: string) => ['catalog', 'nft', id] as const,

  /**
   * Chave de query privada desligada por falta de sessão. Fica fora de
   * `['private']` para que nada de usuário viva ali sem dono.
   */
  inactive: (name: string) => ['inactive', name] as const,

  /** Tudo do visitante (carrinho de visitante e avisos de mudança). */
  guest: ['guest'] as const,

  private: (userId: string) => ['private', userId] as const,
  allPrivate: ['private'] as const,
  favorites: (userId: string) => ['private', userId, 'favorites'] as const,
  cart: (userId: string | null) =>
    userId ? (['private', userId, 'cart'] as const) : (['guest', 'cart'] as const),
  /** Mudanças de preço/estoque detectadas no carrinho fora da ação do usuário. */
  cartChanges: (userId: string | null) =>
    userId ? (['private', userId, 'cart-changes'] as const) : (['guest', 'cart-changes'] as const),
  order: (userId: string, orderId: string) => ['private', userId, 'order', orderId] as const,
  receipt: (userId: string, orderId: string) => ['private', userId, 'receipt', orderId] as const,
  pendingCheckout: (userId: string) => ['private', userId, 'pending-checkout'] as const,
  profile: (userId: string) => ['private', userId, 'profile'] as const,
  wallets: (userId: string) => ['private', userId, 'wallets'] as const,
} as const
