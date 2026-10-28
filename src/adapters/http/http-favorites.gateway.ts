import type { AxiosInstance } from 'axios'

import type { Favorite } from '@domain/entities/favorite'

import type { RequestOptions } from '@application/ports/gateways/catalog.gateway'
import type { FavoritesGateway } from '@application/ports/gateways/favorites.gateway'

import { apiRoutes, type FavoritesDto } from '@adapters/http/contracts'
import { toFavorite } from '@adapters/mappers/api.mapper'

export class HttpFavoritesGateway implements FavoritesGateway {
  private readonly http: AxiosInstance

  constructor(http: AxiosInstance) {
    this.http = http
  }

  async list(options: RequestOptions = {}): Promise<readonly Favorite[]> {
    const { data } = await this.http.get<FavoritesDto>(apiRoutes.favorites, { ...options })
    return data.items.map(toFavorite)
  }

  async add(nftId: string): Promise<void> {
    await this.http.put(apiRoutes.favorite(nftId))
  }

  async remove(nftId: string): Promise<void> {
    await this.http.delete(apiRoutes.favorite(nftId))
  }
}
