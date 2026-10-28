import type { Nft } from '@domain/entities/nft'
import type { NftReviews } from '@domain/entities/nft-review'

import type { CatalogFacets, CatalogQuery, Page } from '@application/dtos/catalog'

export type RequestOptions = {
  /** Cancelamento vindo da camada de estado (ex.: consulta obsoleta no TanStack Query). */
  readonly signal?: AbortSignal
}

export interface CatalogGateway {
  list(query: CatalogQuery, options?: RequestOptions): Promise<Page<Nft>>
  listFeatured(options?: RequestOptions): Promise<readonly Nft[]>
  facets(options?: RequestOptions): Promise<CatalogFacets>
  /** `null` quando o NFT não existe. */
  findById(id: string, options?: RequestOptions): Promise<Nft | null>
  /** `null` quando o NFT não existe. */
  listReviews(nftId: string, options?: RequestOptions): Promise<NftReviews | null>
}
