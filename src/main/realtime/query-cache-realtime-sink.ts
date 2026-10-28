import type { QueryClient } from '@tanstack/react-query'

import type { Cart } from '@domain/entities/cart'
import type { Favorite } from '@domain/entities/favorite'
import { isNewerVersion, type Nft } from '@domain/entities/nft'
import { reconcileOrder, type Order } from '@domain/entities/order'

import type { Page } from '@application/dtos/catalog'
import type { RealtimeSink } from '@application/ports/services/realtime-sink'

import { queryKeys } from '@main/query/query-keys'

const replaceNewer = (current: Nft, incoming: Nft) =>
  current.id === incoming.id && isNewerVersion(current, incoming.version) ? incoming : current

/**
 * Aplica eventos no cache do TanStack Query:
 * - `nft.updated` substitui o NFT em detalhe, listas, destaques e favoritos
 *   apenas se a versão for mais nova; o carrinho que contém o NFT é recarregado
 *   (o resumo de valores vem sempre da API);
 * - `order.updated` passa por `reconcileOrder` (sem regressão, finais imutáveis);
 * - reconexão invalida tudo que pode ter mudado durante a queda.
 */
export class QueryCacheRealtimeSink implements RealtimeSink {
  private readonly queryClient: QueryClient
  private readonly currentUserId: () => string | null

  constructor(queryClient: QueryClient, currentUserId: () => string | null) {
    this.queryClient = queryClient
    this.currentUserId = currentUserId
  }

  applyNft(nft: Nft): void {
    const client = this.queryClient
    client.setQueryData<Nft>(queryKeys.nft(nft.id), (current) =>
      current ? replaceNewer(current, nft) : current,
    )
    client.setQueriesData<Page<Nft>>({ queryKey: queryKeys.catalogLists }, (page) =>
      page ? { ...page, items: page.items.map((item) => replaceNewer(item, nft)) } : page,
    )
    client.setQueryData<readonly Nft[]>(queryKeys.featured, (items) =>
      items?.map((item) => replaceNewer(item, nft)),
    )

    const userId = this.currentUserId()
    if (userId) {
      client.setQueryData<readonly Favorite[]>(queryKeys.favorites(userId), (items) =>
        items?.map((favorite) => ({ ...favorite, nft: replaceNewer(favorite.nft, nft) })),
      )
    }

    const cartKey = queryKeys.cart(userId)
    const cart = client.getQueryData<Cart>(cartKey)
    if (cart?.lines.some((line) => line.nftId === nft.id)) {
      void client.invalidateQueries({ queryKey: cartKey, exact: true })
    }
  }

  applyOrder(order: Order): void {
    const userId = this.currentUserId()
    if (!userId) return
    const key = queryKeys.order(userId, order.id)
    const previous = this.queryClient.getQueryData<Order>(key)
    const next = reconcileOrder(previous, order)
    if (next === previous) return
    this.queryClient.setQueryData(key, next)

    if (next.status === 'confirmed') {
      // Itens comprados saem do carrinho no servidor; recibo passa a existir.
      void this.queryClient.invalidateQueries({ queryKey: queryKeys.cart(userId), exact: true })
      void this.queryClient.invalidateQueries({ queryKey: queryKeys.receipt(userId, order.id) })
    }
    if (next.status !== 'pending') {
      void this.queryClient.invalidateQueries({ queryKey: queryKeys.pendingCheckout(userId) })
    }
  }

  reconcile(): void {
    void this.queryClient.invalidateQueries({ queryKey: queryKeys.catalog })
    void this.queryClient.invalidateQueries({ queryKey: queryKeys.guest })
    const userId = this.currentUserId()
    if (userId) void this.queryClient.invalidateQueries({ queryKey: queryKeys.private(userId) })
  }
}
