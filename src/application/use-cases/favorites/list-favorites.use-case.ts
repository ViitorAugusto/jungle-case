import type { Favorite } from '@domain/entities/favorite'

import type { RequestOptions } from '@application/ports/gateways/catalog.gateway'
import type { FavoritesGateway } from '@application/ports/gateways/favorites.gateway'
import type { SessionState } from '@application/services/session-state'
import { requireSession } from '@application/services/require-session'

export class ListFavoritesUseCase {
  private readonly favorites: FavoritesGateway
  private readonly session: SessionState

  constructor(favorites: FavoritesGateway, session: SessionState) {
    this.favorites = favorites
    this.session = session
  }

  execute(options?: RequestOptions): Promise<readonly Favorite[]> {
    requireSession(this.session)
    return this.favorites.list(options)
  }
}
