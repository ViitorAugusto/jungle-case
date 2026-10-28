import type { NetworkDto, NftDto, NftEditionDto, NftRarityDto, NftReviewDto } from '@adapters/http/contracts'

import { addEth, percentOfEth, roundEth } from '@mocks/db/eth'

/**
 * Cenário conhecido do servidor simulado. Dados neutros e determinísticos
 * (mesma entrada → mesmo catálogo); o reset volta exatamente para cá.
 */

export type UserRecord = {
  id: string
  /** Nome de exibição (também o nome da sessão). */
  name: string
  /** Único entre os usuários. */
  username: string
  email: string
  ensName: string
  walletNickname: string
  avatarUrl: string | null
  /** SHA-256 de `salt:senha` em hexadecimal. A senha nunca é guardada em claro. */
  passwordHash: string
  salt: string
  updatedAt: string
}

/** Credenciais fictícias publicadas no README. */
export const fixtureUsers: readonly UserRecord[] = [
  {
    id: 'usr_alex',
    name: 'Alex Rocha',
    username: 'alex_rocha',
    email: 'alex@jungle.test',
    ensName: 'alexrocha.eth',
    walletNickname: 'Cofre do Alex',
    avatarUrl: null,
    salt: 's4lt-alex-01',
    passwordHash: '3f3b0db428d65c6ef1320b32e2cc3b9f982974526bfffb3b06233ea2aa07163e',
    updatedAt: '2026-01-10T12:00:00.000Z',
  },
  {
    id: 'usr_bia',
    name: 'Bia Lima',
    username: 'bia_lima',
    email: 'bia@jungle.test',
    ensName: '',
    walletNickname: '',
    avatarUrl: null,
    salt: 's4lt-bia-02',
    passwordHash: 'f26c58d73afcee72a7a848e8f7692135655fcbf3bfd65f358b75b541b9f3121e',
    updatedAt: '2026-01-10T12:00:00.000Z',
  },
]

export type CouponRecord = {
  code: string
  kind: 'percentage' | 'fixed'
  value: string
  description: string
  expiresAt: string
}

export const fixtureCoupons: readonly CouponRecord[] = [
  {
    code: 'JUNGLE10',
    kind: 'percentage',
    value: '1000',
    description: '10% de desconto no subtotal',
    expiresAt: '2099-12-31T23:59:59.000Z',
  },
  {
    code: 'ETH005',
    kind: 'fixed',
    value: '0.005',
    description: '0.005 ETH de desconto',
    expiresAt: '2099-12-31T23:59:59.000Z',
  },
  {
    code: 'EXPIRADO20',
    kind: 'percentage',
    value: '2000',
    description: '20% de desconto (expirado)',
    expiresAt: '2024-01-01T00:00:00.000Z',
  },
]

/** Coleções exatamente como no filtro "Coleções" do Figma, na mesma ordem. */
export const fixtureCollections = [
  { id: 'arte-digital', name: 'Arte digital' },
  { id: 'fotografia', name: 'Fotografia' },
  { id: 'musica', name: 'Música' },
  { id: 'arte-3d', name: 'Arte 3D' },
  { id: 'colecionaveis', name: 'Colecionáveis' },
  { id: 'generativa', name: 'Generativa' },
  { id: 'jogos', name: 'Jogos' },
  { id: 'assinaturas', name: 'Assinaturas' },
  { id: 'utilidade', name: 'Utilidade' },
] as const

/** Redes do filtro "Rede" do Figma, na mesma ordem. */
export const fixtureNetworks = [
  { id: 'ethereum', name: 'Ethereum' },
  { id: 'polygon', name: 'Polygon' },
  { id: 'solana', name: 'Solana' },
] as const

/**
 * Coleção fora do filtro "Coleções". O Figma mostra 239 NFTs nas 9 coleções
 * do filtro e 283 nas 3 redes; os 44 restantes ficam aqui, então as duas
 * contagens batem com o mesmo catálogo.
 */
export const unlistedCollection = { id: 'edicoes-especiais', name: 'Edições especiais' } as const

/** Quantidade de NFTs por coleção e por rede, exatamente como nos filtros do Figma. */
export const figmaCollectionCounts: Readonly<Record<string, number>> = {
  'arte-digital': 33,
  fotografia: 12,
  musica: 65,
  'arte-3d': 39,
  colecionaveis: 23,
  generativa: 17,
  jogos: 19,
  assinaturas: 13,
  utilidade: 18,
  [unlistedCollection.id]: 44,
}
export const figmaNetworkCounts: Readonly<Record<NetworkDto, number>> = {
  ethereum: 119,
  polygon: 78,
  solana: 86,
}

/** Lançados a partir desta data aparecem na aba "Novos lançamentos" (data fixa = determinístico). */
export const NEW_RELEASE_CUTOFF = '2026-09-25T00:00:00.000Z'
/** Pontuação mínima para a aba "Em alta". */
export const TRENDING_MIN_SCORE = 70

const creators = [
  { name: 'Nova Sato', avatarUrl: '/images/creators/creator-1.svg' },
  { name: 'Lia Campos', avatarUrl: '/images/creators/creator-2.svg' },
  { name: 'Coletivo Raiz', avatarUrl: '/images/creators/creator-3.svg' },
  { name: 'Davi Prado', avatarUrl: '/images/creators/creator-4.svg' },
] as const

/** Série do contrato exibida em "Coleção:" nos metadados do Detalhe. */
const SERIES = { id: 'kurio-apes', name: 'Kurio Apes' } as const
/** Nome do programa editorial citado nos textos do Figma. */
const EDITIONS_LABEL = 'Kurio Editions'
const ROYALTY_PERCENT = 5
const IMAGES_PER_NFT = 4

/** Contrato da série em cada rede (Figma: "0x7A42...19E8" na Ethereum). */
const contracts: Readonly<Record<NetworkDto, { address: string; standard: string }>> = {
  ethereum: { address: '0x7A42c1d3e5f60718293a4b5c6d7e8f9012a319E8', standard: 'ERC-721' },
  polygon: { address: '0x3C91b2a4c6d8e0f1a3b5c7d9e1f2a4b6c8d0A07F', standard: 'ERC-721' },
  solana: { address: 'KurApes9mZr4TqW2nV8bXc5LdHs3YpFeG6uJk7Nx', standard: 'Metaplex' },
}

/**
 * Artes do Figma (variantes otimizadas em `public/images/nfts`): 1 = macaco de
 * óculos e jaqueta verde, 2 = gorila de chapéu e moletom lilás, 3 = gorila
 * preto de blazer, 4 = macaco laranja de fones.
 */
type ArtIndex = 1 | 2 | 3 | 4
const ART_COUNT = 4
const artAttributes: Readonly<Record<ArtIndex, readonly string[]>> = {
  1: ['Óculos', 'Jaqueta verde'],
  2: ['Chapéu', 'Moletom lilás'],
  3: ['Blazer', 'Gola alta'],
  4: ['Fones', 'Jaqueta creme'],
}

type FigmaCard = {
  name: string
  price: string
  compareAt?: string
  art: ArtIndex
  tokenId: string
  collection: string
  trendingScore: number
  rarity?: NftRarityDto
  attributes?: readonly string[]
  rating?: { average: number; count: number }
}

/**
 * Página 1 da grade do Figma em "Listados recentemente", na ordem. A arte, o
 * token e a coleção seguem os frames: Emerald Ape e os 5 de "Mais desta
 * coleção" ficam na mesma coleção; os 5 de "Colecionadores também viram" têm
 * as maiores pontuações de tendência. O token repete o número do nome, como no
 * frame do Pagamento (os frames divergem entre si).
 */
const figmaCards: readonly FigmaCard[] = [
  {
    name: 'Emerald Ape #042',
    price: '1.19',
    art: 1,
    tokenId: '#0042',
    collection: 'arte-digital',
    trendingScore: 88,
    attributes: ['Óculos', 'Esmeralda', 'Raro'],
    rating: { average: 4.8, count: 19 },
  },
  {
    name: 'Sage Nomad #009',
    price: '1.69',
    art: 2,
    tokenId: '#0009',
    collection: 'fotografia',
    trendingScore: 74,
  },
  {
    name: 'Neon Vessel #552',
    price: '1.99',
    compareAt: '2.29',
    art: 3,
    tokenId: '#0552',
    collection: 'arte-3d',
    trendingScore: 91,
    rarity: 'raro',
  },
  {
    name: 'Cosmic Bloom #118',
    price: '1.29',
    art: 2,
    tokenId: '#0118',
    collection: 'arte-digital',
    trendingScore: 99,
  },
  {
    name: 'Violet Nomad #314',
    price: '1.39',
    art: 2,
    tokenId: '#0314',
    collection: 'arte-digital',
    trendingScore: 98,
  },
  {
    name: 'Ivory Baron #088',
    price: '1.79',
    art: 3,
    tokenId: '#0088',
    collection: 'arte-digital',
    trendingScore: 97,
  },
  {
    name: 'Golden Beat #207',
    price: '0.99',
    art: 4,
    tokenId: '#0207',
    collection: 'arte-digital',
    trendingScore: 96,
  },
  {
    name: 'Golden Frequency #071',
    price: '0.59',
    art: 4,
    tokenId: '#0071',
    collection: 'musica',
    trendingScore: 80,
  },
  {
    name: 'Golden Signal #160',
    price: '0.39',
    art: 4,
    tokenId: '#0160',
    collection: 'arte-digital',
    trendingScore: 95,
  },
]

const ADJECTIVES = [
  'Crimson',
  'Azure',
  'Lunar',
  'Solar',
  'Onyx',
  'Coral',
  'Jade',
  'Silver',
  'Velvet',
] as const
const NOUNS = ['Ape', 'Nomad', 'Vessel', 'Bloom', 'Baron', 'Beat', 'Signal', 'Echo', 'Drift'] as const
/** Faixa do Figma: 0,02 a 12,30 ETH. */
const PRICE_TABLE = [
  '0.02',
  '0.05',
  '0.08',
  '0.12',
  '0.18',
  '0.25',
  '0.33',
  '0.45',
  '0.59',
  '0.75',
  '0.89',
  '1.05',
  '1.49',
  '2.1',
  '2.75',
  '3.4',
  '4.2',
  '5.6',
  '7.25',
  '9.8',
  '12.3',
] as const

const TOTAL_NFTS = Object.values(figmaNetworkCounts).reduce((sum, count) => sum + count, 0)
/** Pontuação máxima dos gerados: abaixo dos 5 sugeridos do Figma (95–99). */
const GENERATED_TRENDING_CAP = 95
const NEWEST_DATE = Date.UTC(2026, 9, 20)
const DAY_MS = 86_400_000
const SHUFFLE_SEED = 0x6b7572

/** Gerador pseudoaleatório com semente fixa (mulberry32): mesma semente, mesma sequência. */
const seededRandom = (seed: number) => {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4_294_967_296
  }
}

/**
 * Distribui as vagas restantes de cada contagem (descontados os cards do
 * Figma) pelos índices gerados, embaralhadas com semente fixa.
 */
const distribute = <K extends string>(
  counts: Readonly<Record<K, number>>,
  reserved: readonly K[],
  seed: number,
) => {
  const remaining: Record<K, number> = { ...counts }
  for (const key of reserved) remaining[key] -= 1
  const pool = (Object.entries(remaining) as [K, number][]).flatMap(([key, count]) =>
    Array.from({ length: count }, () => key),
  )
  const random = seededRandom(seed)
  for (let index = pool.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(random() * (index + 1))
    ;[pool[index], pool[swap]] = [pool[swap] as K, pool[index] as K]
  }
  return [...reserved, ...pool]
}

const FIGMA_NETWORK: NetworkDto = 'ethereum'
const collectionByIndex = distribute(
  figmaCollectionCounts,
  figmaCards.map((card) => card.collection),
  SHUFFLE_SEED,
)
const networkByIndex = distribute(
  figmaNetworkCounts,
  figmaCards.map(() => FIGMA_NETWORK),
  SHUFFLE_SEED + 1,
)

const allCollections = [...fixtureCollections, unlistedCollection]
const collectionFor = (index: number) =>
  allCollections.find((collection) => collection.id === collectionByIndex[index]) ?? unlistedCollection
const networkFor = (index: number): NetworkDto => networkByIndex[index] ?? FIGMA_NETWORK
const networkName = (network: NetworkDto) => fixtureNetworks.find(({ id }) => id === network)?.name ?? network

/** JPEG de 640 px: fallback do `srcset` que a interface monta (AVIF/WebP/JPEG). */
const imageUrl = (art: ArtIndex) => `/images/nfts/kurio-nft-${art}-640.jpg`
const artFor = (index: number): ArtIndex => figmaCards[index]?.art ?? (((index % ART_COUNT) + 1) as ArtIndex)
const pick = <T>(items: readonly T[], index: number): T => items[index % items.length] as T

const nameFor = (index: number) =>
  figmaCards[index]?.name ??
  `${pick(ADJECTIVES, index)} ${pick(NOUNS, index * 4 + 1)} #${String((index * 37) % 1000).padStart(3, '0')}`

/** Tokens do Figma nos cards da página 1; os gerados seguem a partir de #1009 (sem colisão). */
const tokenIdFor = (index: number) =>
  figmaCards[index]?.tokenId ?? `#${String(1000 + index).padStart(4, '0')}`

const priceFor = (index: number) => figmaCards[index]?.price ?? pick(PRICE_TABLE, index * 5)

const compareAtFor = (index: number, price: string) => {
  const card = figmaCards[index]
  if (card) return card.compareAt ?? null
  return index % 8 === 3 ? roundEth(addEth(price, percentOfEth(price, 1_500))) : null
}

const trendingScoreFor = (index: number) =>
  figmaCards[index]?.trendingScore ?? (index * 37 + 71) % GENERATED_TRENDING_CAP

const rarityFor = (index: number): NftRarityDto => {
  const card = figmaCards[index]
  if (card) return card.rarity ?? 'comum'
  return index % 6 === 2 ? 'raro' : 'comum'
}

const attributesFor = (index: number, art: ArtIndex, rarity: NftRarityDto) =>
  figmaCards[index]?.attributes ?? [...artAttributes[art], ...(rarity === 'raro' ? ['Raro'] : [])]

/**
 * Notas (1 a 5) de `count` avaliações cuja soma é `round(target * count)`:
 * começa tudo em 5 e tira 1 ponto por vez, em rodízio.
 */
const reviewNotes = (target: number, count: number) => {
  const notes = Array.from({ length: count }, () => 5)
  let deficit = 5 * count - Math.round(target * count)
  for (let index = 0; deficit > 0; index = (index + 1) % count) {
    const note = notes[index] ?? 1
    if (note > 1) {
      notes[index] = note - 1
      deficit -= 1
    }
  }
  return notes
}

/** Alvo de 3.6 a 5.0 e de 3 a 50 avaliações; Emerald Ape #042: 4.8 com 19, como no Figma. */
const ratingTargetFor = (index: number) =>
  figmaCards[index]?.rating ?? {
    average: (36 + ((index * 7) % 15)) / 10,
    count: 3 + ((index * 13) % 48),
  }

/** A média publicada sai das próprias notas (1 casa), então o selo e a aba sempre batem. */
const ratingFor = (index: number) => {
  const target = ratingTargetFor(index)
  const notes = reviewNotes(target.average, target.count)
  const sum = notes.reduce((total, note) => total + note, 0)
  return { average: Math.round((sum / notes.length) * 10) / 10, count: notes.length }
}

/** Textos do Detalhe no formato do Figma (Emerald Ape #042 sai igual ao frame). */
const summaryFor = (network: NetworkDto) =>
  `Um colecionável digital finalizado à mão da coleção ${EDITIONS_LABEL}, verificado na ${networkName(network)}, com arte desbloqueável e acesso para colecionadores.`

const descriptionFor = (name: string, network: NetworkDto, creator: string, supply: number) =>
  [
    `${name} é uma obra digital 1/${supply} finalizada à mão da coleção ${EDITIONS_LABEL}. Cada atributo fica armazenado nos metadados do token e verificado na ${networkName(network)}. A obra explora identidade, movimento e luz em um mundo digital sem fronteiras.`,
    `A propriedade inclui a arte em alta resolução, lançamentos exclusivos para colecionadores e um registro permanente de procedência registrada na rede. ${creator} recebe ${ROYALTY_PERCENT}% de direitos autorais nas vendas secundárias, apoiando novos trabalhos e lançamentos da comunidade.`,
  ].join('\n\n')

const STANDARD_SUPPLY = 50
/** Estoque oferecido pela edição aberta (sem tiragem máxima). */
const OPEN_EDITION_STOCK = 100

/**
 * Edições na ordem dos chips do Figma: 1/1 (Lendária), 1/10 (Rara), 1/50
 * (Padrão) e Aberta (`supply: null`). Regras de estoque (documentadas em
 * `fixture-ids.ts`): `index % 11 === 10` esgota todas; `index % 5 === 0`
 * esgota a Rara; `index % 8 === 0` esgota a Lendária. No Emerald Ape #042 a
 * Padrão 1/50 é a primeira disponível, como no frame. A Aberta custa o mesmo
 * que a Padrão (o card continua mostrando o preço do Figma). Preços derivados
 * saem com no máximo 3 casas.
 */
const editionsFor = (index: number, nftId: string): NftEditionDto[] => {
  const price = priceFor(index)
  const allSoldOut = index % 11 === 10
  const editions: NftEditionDto[] = []
  if (index % 4 === 0) {
    editions.push({
      id: `${nftId}-legend`,
      name: 'Lendária',
      priceEth: roundEth(addEth(price, percentOfEth(price, 40_000))),
      compareAtPriceEth: null,
      supply: 1,
      available: allSoldOut || index % 8 === 0 ? 0 : 1,
    })
  }
  if (index % 3 !== 2) {
    editions.push({
      id: `${nftId}-rare`,
      name: 'Rara',
      priceEth: roundEth(addEth(price, percentOfEth(price, 15_000))),
      compareAtPriceEth: null,
      supply: 10,
      available: allSoldOut || index % 5 === 0 ? 0 : 1 + (index % 4),
    })
  }
  editions.push({
    id: `${nftId}-std`,
    name: 'Padrão',
    priceEth: price,
    compareAtPriceEth: compareAtFor(index, price),
    supply: STANDARD_SUPPLY,
    available: allSoldOut ? 0 : 5 + (index % 20),
  })
  if (index % 3 === 0) {
    editions.push({
      id: `${nftId}-open`,
      name: 'Aberta',
      priceEth: price,
      compareAtPriceEth: null,
      supply: null,
      available: allSoldOut ? 0 : OPEN_EDITION_STOCK,
    })
  }
  return editions
}

/** Edição Padrão (todo NFT tem uma): alvo padrão dos controles de preço e estoque. */
export const standardEditionOf = (nft: NftDto): NftEditionDto | undefined =>
  nft.editions.find((edition) => edition.id === `${nft.id}-std`) ?? nft.editions[0]

/** Catálogo determinístico: índice 0 é o mais recente (destaque do hero). */
export const createFixtureNfts = (): NftDto[] =>
  Array.from({ length: TOTAL_NFTS }, (_, index) => {
    const id = `nft-${String(index + 1).padStart(3, '0')}`
    const name = nameFor(index)
    const collection = collectionFor(index)
    const network = networkFor(index)
    const creator = pick(creators, index)
    const art = artFor(index)
    const rarity = rarityFor(index)
    const contract = contracts[network]
    return {
      id,
      name,
      tokenId: tokenIdFor(index),
      summary: summaryFor(network),
      description: descriptionFor(name, network, creator.name, STANDARD_SUPPLY),
      collection: { id: collection.id, name: collection.name },
      series: { id: SERIES.id, name: SERIES.name },
      network,
      creator: { name: creator.name, avatarUrl: creator.avatarUrl },
      attributes: attributesFor(index, art, rarity),
      rarity,
      rating: ratingFor(index),
      provenance: {
        contractAddress: contract.address,
        tokenStandard: contract.standard,
        metadataStorage: 'IPFS',
        royaltyPercent: ROYALTY_PERCENT,
      },
      // Figma: 4 miniaturas da mesma arte na galeria do Detalhe.
      images: Array.from({ length: IMAGES_PER_NFT }, (_, view) => ({
        url: imageUrl(art),
        alt: `${name}, arte digital da coleção ${collection.name} (vista ${view + 1} de ${IMAGES_PER_NFT})`,
      })),
      editions: editionsFor(index, id),
      featured: index % fixtureCollections.length === 0,
      trendingScore: trendingScoreFor(index),
      createdAt: new Date(NEWEST_DATE - index * 2 * DAY_MS).toISOString(),
      version: 1,
    }
  })

// ---------- Avaliações de colecionadores ----------

/** Data da avaliação mais recente; as demais recuam 3 dias cada (data fixa = determinístico). */
const NEWEST_REVIEW_DATE = Date.UTC(2026, 9, 26)

const reviewers = [
  { name: 'Marina Duarte', avatarUrl: '/images/creators/creator-2.svg' },
  { name: 'Caio Mendes', avatarUrl: '/images/creators/creator-4.svg' },
  { name: 'Júlia Ferraz', avatarUrl: '/images/creators/creator-1.svg' },
  { name: 'Rafael Toledo', avatarUrl: '/images/creators/creator-3.svg' },
  { name: 'Bruna Kato', avatarUrl: '/images/creators/creator-2.svg' },
  { name: 'Otávio Reis', avatarUrl: '/images/creators/creator-4.svg' },
] as const

const reviewComments = [
  'Arte impecável, os detalhes aparecem ainda melhor na resolução máxima.',
  'Procedência clara e entrega rápida na carteira. Recomendo.',
  'Uma das peças mais bonitas da minha coleção.',
  'Os atributos combinam muito bem com o restante da série.',
  'Boa relação entre preço e raridade da edição.',
  'Comunidade ativa e lançamentos exclusivos fazem valer a compra.',
  'A paleta de cores é ainda mais bonita do que nas prévias.',
] as const

/**
 * Avaliações determinísticas de um NFT: `rating.count` itens cujas notas
 * reproduzem `rating.average` (mesma regra que gerou o selo).
 */
export const createFixtureReviews = (nft: NftDto): NftReviewDto[] => {
  const notes = reviewNotes(nft.rating.average, nft.rating.count)
  const seed = Number(nft.id.replace(/\D/g, '')) || 0
  return notes.map((rating, index) => ({
    id: `${nft.id}-review-${String(index + 1).padStart(2, '0')}`,
    author: { ...pick(reviewers, seed + index) },
    rating,
    comment: pick(reviewComments, seed * 3 + index),
    createdAt: new Date(NEWEST_REVIEW_DATE - index * 3 * DAY_MS).toISOString(),
  }))
}
