import type { FavoritesGateway } from '@application/ports/gateways/favorites.gateway'
import type { SessionState } from '@application/services/session-state'
import { requireSession } from '@application/services/require-session'

export type SetFavoriteInput = {
  readonly nftId: string
  readonly favorite: boolean
}

/** Marca ou desmarca um NFT como favorito do usuário autenticado. */
export class SetFavoriteUseCase {
  private readonly favorites: FavoritesGateway
  private readonly session: SessionState

  constructor(favorites: FavoritesGateway, session: SessionState) {
    this.favorites = favorites
    this.session = session
  }

  async execute(input: SetFavoriteInput): Promise<void> {
    requireSession(this.session)
    if (input.favorite) await this.favorites.add(input.nftId)
    else await this.favorites.remove(input.nftId)
  }
}
