import type { FavoritesDto } from '@adapters/http/contracts'

import { db } from '@mocks/db/database'
import { ApiError, commitEmpty, commitJson, route } from '@mocks/http/respond'
import { authenticate } from '@mocks/services/auth'

export const favoritesHandlers = [
  route('get', '/favorites', ({ request }) => {
    const { user } = authenticate(request)
    const items = db.state.favorites
      .filter((favorite) => favorite.userId === user.id)
      .flatMap((favorite) => {
        const nft = db.findNft(favorite.nftId)
        return nft ? [{ nftId: favorite.nftId, createdAt: favorite.createdAt, nft }] : []
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    const body: FavoritesDto = { items }
    return commitJson(body)
  }),

  route('put', '/favorites/:nftId', ({ request, params }) => {
    const { user } = authenticate(request)
    const nftId = params.nftId ?? ''
    if (!db.findNft(nftId)) throw new ApiError(404, 'NFT_NOT_FOUND', 'NFT não encontrado')
    const existing = db.state.favorites.find(
      (favorite) => favorite.userId === user.id && favorite.nftId === nftId,
    )
    const favorite = existing ?? { userId: user.id, nftId, createdAt: new Date().toISOString() }
    if (!existing) db.state.favorites.push(favorite)
    return commitJson({ nftId, createdAt: favorite.createdAt })
  }),

  route('delete', '/favorites/:nftId', ({ request, params }) => {
    const { user } = authenticate(request)
    db.state.favorites = db.state.favorites.filter(
      (favorite) => !(favorite.userId === user.id && favorite.nftId === params.nftId),
    )
    return commitEmpty()
  }),
]
