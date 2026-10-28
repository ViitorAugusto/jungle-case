import type { NftDto, NftEditionDto } from '@adapters/http/contracts'

import { addEth, percentOfEth } from '@mocks/db/eth'

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

/** Lançados a partir desta data aparecem na aba "Novos lançamentos" (data fixa = determinístico). */
export const NEW_RELEASE_CUTOFF = '2026-09-25T00:00:00.000Z'
/** Pontuação mínima para a aba "Em alta". */
export const TRENDING_MIN_SCORE = 70

const creators = [
  { name: 'Estúdio Norte', avatarUrl: '/images/creators/creator-1.svg' },
  { name: 'Lia Campos', avatarUrl: '/images/creators/creator-2.svg' },
  { name: 'Coletivo Raiz', avatarUrl: '/images/creators/creator-3.svg' },
  { name: 'Davi Prado', avatarUrl: '/images/creators/creator-4.svg' },
] as const

/**
 * Artes do Figma (variantes otimizadas em `public/images/nfts`): 1 = macaco de
 * óculos e jaqueta verde, 2 = gorila de chapéu e moletom lilás, 3 = gorila
 * preto de blazer, 4 = macaco laranja de fones.
 */
type ArtIndex = 1 | 2 | 3 | 4
const ART_COUNT = 4

/** Cards do grid do Figma (página 1 em "Listados recentemente"): nome, preço, preço riscado e arte. */
const figmaCards: readonly { name: string; price: string; compareAt?: string; art: ArtIndex }[] = [
  { name: 'Emerald Ape #042', price: '1.19', art: 1 },
  { name: 'Sage Nomad #009', price: '1.69', art: 2 },
  { name: 'Neon Vessel #552', price: '1.99', compareAt: '2.29', art: 3 },
  { name: 'Cosmic Bloom #118', price: '1.29', art: 4 },
  { name: 'Violet Nomad #314', price: '1.39', art: 1 },
  { name: 'Ivory Baron #088', price: '1.79', art: 2 },
  { name: 'Golden Beat #207', price: '0.99', art: 4 },
  { name: 'Golden Signal #160', price: '0.39', art: 3 },
  { name: 'Amber Echo #071', price: '0.39', art: 1 },
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
const NETWORK_CYCLE = ['ethereum', 'solana', 'polygon', 'ethereum', 'solana', 'polygon', 'ethereum'] as const

const TOTAL_NFTS = fixtureCollections.length * 6
const NEWEST_DATE = Date.UTC(2026, 9, 20)
const DAY_MS = 86_400_000

/** JPEG de 640 px: fallback do `srcset` que a interface monta (AVIF/WebP/JPEG). */
const imageUrl = (art: ArtIndex) => `/images/nfts/kurio-nft-${art}-640.jpg`
const artFor = (index: number): ArtIndex => figmaCards[index]?.art ?? (((index % ART_COUNT) + 1) as ArtIndex)
const nextArt = (art: ArtIndex): ArtIndex => ((art % ART_COUNT) + 1) as ArtIndex
const pick = <T>(items: readonly T[], index: number): T => items[index % items.length] as T

const nameFor = (index: number) =>
  figmaCards[index]?.name ??
  `${pick(ADJECTIVES, index)} ${pick(NOUNS, index * 4 + 1)} #${String((index * 37) % 1000).padStart(3, '0')}`

const priceFor = (index: number) => figmaCards[index]?.price ?? pick(PRICE_TABLE, index * 5)

const compareAtFor = (index: number, price: string) => {
  const card = figmaCards[index]
  if (card) return card.compareAt ?? null
  return index % 8 === 3 ? addEth(price, percentOfEth(price, 1_500)) : null
}

/**
 * Regras de estoque (documentadas em `fixture-ids.ts`): `index % 11 === 10`
 * esgota todas as edições; `index % 5 === 0` esgota a edição "Rara".
 */
const editionsFor = (index: number, nftId: string): NftEditionDto[] => {
  const price = priceFor(index)
  const allSoldOut = index % 11 === 10
  const editions: NftEditionDto[] = [
    {
      id: `${nftId}-std`,
      name: 'Padrão',
      priceEth: price,
      compareAtPriceEth: compareAtFor(index, price),
      supply: 50,
      available: allSoldOut ? 0 : 5 + (index % 20),
    },
  ]
  if (index % 3 !== 2) {
    editions.push({
      id: `${nftId}-rare`,
      name: 'Rara',
      priceEth: addEth(price, percentOfEth(price, 15_000)),
      compareAtPriceEth: null,
      supply: 10,
      available: allSoldOut || index % 5 === 0 ? 0 : 1 + (index % 4),
    })
  }
  if (index % 4 === 0) {
    editions.push({
      id: `${nftId}-legend`,
      name: 'Lendária',
      priceEth: addEth(price, percentOfEth(price, 40_000)),
      compareAtPriceEth: null,
      supply: 1,
      available: allSoldOut ? 0 : 1,
    })
  }
  return editions
}

/** Catálogo determinístico: índice 0 é o mais recente (destaque do hero). */
export const createFixtureNfts = (): NftDto[] =>
  Array.from({ length: TOTAL_NFTS }, (_, index) => {
    const id = `nft-${String(index + 1).padStart(3, '0')}`
    const name = nameFor(index)
    const collection = pick(fixtureCollections, index)
    const creator = pick(creators, index)
    const art = artFor(index)
    return {
      id,
      name,
      description: `${name}, da coleção ${collection.name}, criado por ${creator.name}. Edição digital numerada com certificado on-chain simulado.`,
      collection: { id: collection.id, name: collection.name },
      network: pick(NETWORK_CYCLE, index),
      creator: { name: creator.name, avatarUrl: creator.avatarUrl },
      images: [
        { url: imageUrl(art), alt: `${name}, arte digital da coleção ${collection.name}` },
        { url: imageUrl(nextArt(art)), alt: `${name}, vista alternativa da arte` },
      ],
      editions: editionsFor(index, id),
      featured: index % fixtureCollections.length === 0,
      trendingScore: (index * 37 + 71) % 100,
      createdAt: new Date(NEWEST_DATE - index * 2 * DAY_MS).toISOString(),
      version: 1,
    }
  })
