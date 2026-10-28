import type { Favorite } from '@domain/entities/favorite'

import type { RequestOptions } from '@application/ports/gateways/catalog.gateway'

export interface FavoritesGateway {
  list(options?: RequestOptions): Promise<readonly Favorite[]>
  add(nftId: string): Promise<void>
  remove(nftId: string): Promise<void>
}
