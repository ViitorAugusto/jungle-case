import type { NftReviews } from '@domain/entities/nft-review'

import { ApplicationError } from '@application/errors/application-error'
import type { CatalogGateway, RequestOptions } from '@application/ports/gateways/catalog.gateway'

export class ListNftReviewsUseCase {
  private readonly catalog: CatalogGateway

  constructor(catalog: CatalogGateway) {
    this.catalog = catalog
  }

  async execute(nftId: string, options?: RequestOptions): Promise<NftReviews> {
    const reviews = await this.catalog.listReviews(nftId, options)
    if (!reviews)
      throw new ApplicationError('NOT_FOUND', 'NFT não encontrado', { status: 404, reason: 'NFT_NOT_FOUND' })
    return reviews
  }
}
