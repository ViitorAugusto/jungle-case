import type { AxiosInstance } from 'axios'

import type { Nft } from '@domain/entities/nft'
import type { NftReviews } from '@domain/entities/nft-review'

import type { CatalogFacets, CatalogQuery, Page } from '@application/dtos/catalog'
import { isApplicationError } from '@application/errors/application-error'
import type { CatalogGateway, RequestOptions } from '@application/ports/gateways/catalog.gateway'

import {
  apiRoutes,
  catalogQueryParams as param,
  type CatalogFacetsDto,
  type NftDto,
  type NftReviewsDto,
  type PageDto,
} from '@adapters/http/contracts'
import { toFacets, toNft, toNftPage, toNftReviews } from '@adapters/mappers/api.mapper'

const FEATURED_LIMIT = '6'

const toSearchParams = (query: CatalogQuery): URLSearchParams => {
  const params = new URLSearchParams()
  if (query.search) params.set(param.search, query.search)
  for (const id of query.collections) params.append(param.collection, id)
  for (const network of query.networks) params.append(param.network, network)
  if (query.minPriceEth) params.set(param.minPrice, query.minPriceEth)
  if (query.maxPriceEth) params.set(param.maxPrice, query.maxPriceEth)
  if (query.tab !== 'todos') params.set(param.tab, query.tab)
  if (query.sort) params.set(param.sort, query.sort)
  params.set(param.page, String(query.page))
  params.set(param.pageSize, String(query.pageSize))
  return params
}

export class HttpCatalogGateway implements CatalogGateway {
  private readonly http: AxiosInstance

  constructor(http: AxiosInstance) {
    this.http = http
  }

  async list(query: CatalogQuery, options: RequestOptions = {}): Promise<Page<Nft>> {
    const { data } = await this.http.get<PageDto<NftDto>>(apiRoutes.nfts, {
      params: toSearchParams(query),
      ...options,
    })
    return toNftPage(data)
  }

  async listFeatured(options: RequestOptions = {}): Promise<readonly Nft[]> {
    const params = new URLSearchParams({ [param.featured]: 'true', [param.pageSize]: FEATURED_LIMIT })
    const { data } = await this.http.get<PageDto<NftDto>>(apiRoutes.nfts, { params, ...options })
    return data.items.map(toNft)
  }

  async facets(options: RequestOptions = {}): Promise<CatalogFacets> {
    const { data } = await this.http.get<CatalogFacetsDto>(apiRoutes.nftFacets, { ...options })
    return toFacets(data)
  }

  async findById(id: string, options: RequestOptions = {}): Promise<Nft | null> {
    try {
      const { data } = await this.http.get<NftDto>(apiRoutes.nft(id), { ...options })
      return toNft(data)
    } catch (error) {
      if (isApplicationError(error) && error.code === 'NOT_FOUND') return null
      throw error
    }
  }

  async listReviews(nftId: string, options: RequestOptions = {}): Promise<NftReviews | null> {
    try {
      const { data } = await this.http.get<NftReviewsDto>(apiRoutes.nftReviews(nftId), { ...options })
      return toNftReviews(data)
    } catch (error) {
      if (isApplicationError(error) && error.code === 'NOT_FOUND') return null
      throw error
    }
  }
}
