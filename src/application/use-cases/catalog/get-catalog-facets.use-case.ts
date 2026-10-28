import type { CatalogFacets } from '@application/dtos/catalog'
import type { CatalogGateway, RequestOptions } from '@application/ports/gateways/catalog.gateway'

export class GetCatalogFacetsUseCase {
  private readonly catalog: CatalogGateway

  constructor(catalog: CatalogGateway) {
    this.catalog = catalog
  }

  execute(options?: RequestOptions): Promise<CatalogFacets> {
    return this.catalog.facets(options)
  }
}
