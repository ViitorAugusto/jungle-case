import type { Nft } from '@domain/entities/nft'

import { ApplicationError } from '@application/errors/application-error'
import type { CatalogGateway, RequestOptions } from '@application/ports/gateways/catalog.gateway'

export class GetNftUseCase {
  private readonly catalog: CatalogGateway

  constructor(catalog: CatalogGateway) {
    this.catalog = catalog
  }

  async execute(id: string, options?: RequestOptions): Promise<Nft> {
    const nft = await this.catalog.findById(id, options)
    if (!nft)
      throw new ApplicationError('NOT_FOUND', 'NFT não encontrado', { status: 404, reason: 'NFT_NOT_FOUND' })
    return nft
  }
}
