import type { Nft } from '@domain/entities/nft'

import type { CatalogQuery, Page } from '@application/dtos/catalog'
import type { CatalogGateway, RequestOptions } from '@application/ports/gateways/catalog.gateway'

export class ListNftsUseCase {
  private readonly catalog: CatalogGateway

  constructor(catalog: CatalogGateway) {
    this.catalog = catalog
  }

  execute(query: CatalogQuery, options?: RequestOptions): Promise<Page<Nft>> {
    return this.catalog.list(query, options)
  }
}
