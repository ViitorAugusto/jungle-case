import type { Nft } from '@domain/entities/nft'

export type Favorite = {
  readonly nftId: string
  readonly createdAt: string
  readonly nft: Nft
}
