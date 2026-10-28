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
  /** Tiragem (o "50" de "1/50"); `null` = edição aberta, sem tiragem máxima. */
  readonly supply: number | null
  /** Estoque à venda agora (também na edição aberta). */
  readonly available: number
}

export const isOpenEdition = (edition: NftEdition): boolean => edition.supply === null

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

/** Raridade do token; `raro` ganha o selo "RARO" no card. */
export type NftRarity = 'comum' | 'raro'

export type NftRating = {
  /** Média de 0 a 5, com 1 casa (ex.: 4.8). */
  readonly average: number
  readonly count: number
}

/** Procedência on-chain mostrada na aba "Detalhes do NFT". */
export type NftProvenance = {
  readonly contractAddress: string
  readonly tokenStandard: string
  readonly metadataStorage: string
  /** Direitos autorais do criador nas vendas secundárias, em %. */
  readonly royaltyPercent: number
}

export type Nft = {
  readonly id: string
  readonly name: string
  /** "ID do token" exibido nos metadados, carrinho e recibo (ex.: `#0042`). */
  readonly tokenId: string
  /** Texto curto de "Sobre este NFT". */
  readonly summary: string
  /** Texto longo; parágrafos separados por linha em branco. */
  readonly description: string
  /** Categoria do filtro "Coleções" e de "Mais desta coleção". */
  readonly collection: NftCollection
  /** Série do contrato exibida em "Coleção:" nos metadados (ex.: Kurio Apes). */
  readonly series: NftCollection
  readonly network: NftNetwork
  readonly creator: NftCreator
  readonly attributes: readonly string[]
  readonly rarity: NftRarity
  readonly rating: NftRating
  readonly provenance: NftProvenance
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

/** Parágrafos da descrição longa (linhas em branco separam os parágrafos). */
export const descriptionParagraphs = (nft: Pick<Nft, 'description'>): readonly string[] =>
  nft.description
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)

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
