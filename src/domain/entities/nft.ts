import { EthAmount } from '@domain/value-objects/eth-amount'

export type NftImage = {
  readonly url: string
  readonly alt: string
}

export type NftEdition = {
  readonly id: string
  readonly name: string
  /** Preço unitário em ETH (string decimal). */
  readonly priceEth: string
  /** Preço anterior exibido riscado quando houve redução (`null` sem promoção). */
  readonly compareAtPriceEth: string | null
  readonly supply: number
  readonly available: number
}

/** Blockchain em que o NFT foi cunhado. */
export const nftNetworks = ['ethereum', 'polygon', 'solana'] as const
export type NftNetwork = (typeof nftNetworks)[number]

export const isNftNetwork = (value: string): value is NftNetwork =>
  (nftNetworks as readonly string[]).includes(value)

export type NftCollection = {
  readonly id: string
  readonly name: string
}

export type NftCreator = {
  readonly name: string
  readonly avatarUrl: string
}

export type Nft = {
  readonly id: string
  readonly name: string
  readonly description: string
  readonly collection: NftCollection
  readonly network: NftNetwork
  readonly creator: NftCreator
  readonly images: readonly NftImage[]
  readonly editions: readonly NftEdition[]
  readonly featured: boolean
  /** Pontuação de tendência (0–100) usada pela aba "Em alta". */
  readonly trendingScore: number
  readonly createdAt: string
  /** Versão do recurso no servidor; cresce a cada mudança de preço ou disponibilidade. */
  readonly version: number
}

export const findEdition = (nft: Nft, editionId: string): NftEdition | undefined =>
  nft.editions.find((edition) => edition.id === editionId)

export const isEditionAvailable = (edition: NftEdition): boolean => edition.available > 0

export const isSoldOut = (nft: Nft): boolean => !nft.editions.some(isEditionAvailable)

/** Menor preço entre as edições ainda disponíveis (ou entre todas, se esgotado). */
export const lowestPriceEth = (nft: Nft): string | null => {
  const candidates = isSoldOut(nft) ? nft.editions : nft.editions.filter(isEditionAvailable)
  const lowest = candidates
    .map((edition) => EthAmount.of(edition.priceEth))
    .reduce<EthAmount | null>((min, price) => (min === null || price.compare(min) < 0 ? price : min), null)
  return lowest?.toString() ?? null
}

/** Uma versão mais nova substitui a atual; versões iguais ou antigas são descartadas. */
export const isNewerVersion = (current: { readonly version: number } | undefined, incomingVersion: number) =>
  current === undefined || incomingVersion > current.version
