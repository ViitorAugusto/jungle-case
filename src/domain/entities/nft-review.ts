/** Avaliação de colecionador de um NFT (aba "Avaliações de colecionadores"). */
export type NftReview = {
  readonly id: string
  readonly author: { readonly name: string; readonly avatarUrl: string }
  /** Nota inteira de 1 a 5. */
  readonly rating: number
  readonly comment: string
  readonly createdAt: string
}

export type NftReviews = {
  /** Mais recentes primeiro. */
  readonly items: readonly NftReview[]
  readonly total: number
}
