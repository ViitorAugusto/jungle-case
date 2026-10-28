import type { Nft } from '@domain/entities/nft'

import type { CatalogGateway, RequestOptions } from '@application/ports/gateways/catalog.gateway'

export class ListFeaturedNftsUseCase {
  private readonly catalog: CatalogGateway

  constructor(catalog: CatalogGateway) {
    this.catalog = catalog
  }

  execute(options?: RequestOptions): Promise<readonly Nft[]> {
    return this.catalog.listFeatured(options)
  }
}
