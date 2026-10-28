import {
  catalogQueryParams as param,
  type CatalogFacetsDto,
  type NftDto,
  type NftReviewsDto,
  type PageDto,
} from '@adapters/http/contracts'

import { db } from '@mocks/db/database'
import { compareEth, isEth } from '@mocks/db/eth'
import {
  createFixtureReviews,
  fixtureCollections,
  fixtureNetworks,
  NEW_RELEASE_CUTOFF,
  TRENDING_MIN_SCORE,
} from '@mocks/db/fixtures'
import { ApiError, commitJson, route } from '@mocks/http/respond'
import { scenarios } from '@mocks/scenarios/scenarios'

const MAX_PAGE_SIZE = 48
const DEFAULT_PAGE_SIZE = 9
const COMBINING_MARKS = /[̀-ͯ]/g

const normalize = (text: string) => text.normalize('NFD').replace(COMBINING_MARKS, '').toLowerCase()

const isAvailable = (nft: NftDto) => nft.editions.some((edition) => edition.available > 0)

/** Preço de referência para filtro e ordenação: menor preço entre edições disponíveis. */
const referencePrice = (nft: NftDto) => {
  const pool = isAvailable(nft) ? nft.editions.filter((edition) => edition.available > 0) : nft.editions
  return pool
    .map((edition) => edition.priceEth)
    .reduce((min, price) => (compareEth(price, min) < 0 ? price : min))
}

const positiveInt = (value: string | null, fallback: number) => {
  const parsed = Number(value)
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : fallback
}

const byId = (a: NftDto, b: NftDto) => a.id.localeCompare(b.id)

const sorters: Record<string, (a: NftDto, b: NftDto) => number> = {
  recent: (a, b) => b.createdAt.localeCompare(a.createdAt) || byId(a, b),
  'price-asc': (a, b) => compareEth(referencePrice(a), referencePrice(b)) || byId(a, b),
  'price-desc': (a, b) => compareEth(referencePrice(b), referencePrice(a)) || byId(a, b),
  'name-asc': (a, b) => a.name.localeCompare(b.name, 'pt-BR') || byId(a, b),
  trending: (a, b) => b.trendingScore - a.trendingScore || byId(a, b),
}

/** Abas: "novos" = lançados desde a data de corte; "em-alta" = pontuação de tendência mínima. */
const tabFilters: Record<string, (nft: NftDto) => boolean> = {
  todos: () => true,
  novos: (nft) => nft.createdAt >= NEW_RELEASE_CUTOFF,
  'em-alta': (nft) => nft.trendingScore >= TRENDING_MIN_SCORE,
}

const catalog = () => (scenarios.is('empty') ? [] : db.state.nfts)

export const catalogHandlers = [
  route('get', '/nfts', ({ request }) => {
    const params = new URL(request.url).searchParams
    const search = normalize(params.get(param.search) ?? '')
    const collections = params.getAll(param.collection)
    const networks = params.getAll(param.network)
    const minPrice = params.get(param.minPrice)
    const maxPrice = params.get(param.maxPrice)
    const tab = params.get(param.tab) ?? 'todos'
    const inTab = tabFilters[tab] ?? tabFilters.todos
    // Sem `sort` explícito vale o padrão da aba: tendência em "em-alta", recentes nas demais.
    const sortKey = params.get(param.sort) ?? (tab === 'em-alta' ? 'trending' : 'recent')
    const sort = sorters[sortKey] ?? sorters.recent
    const pageSize = Math.min(positiveInt(params.get(param.pageSize), DEFAULT_PAGE_SIZE), MAX_PAGE_SIZE)

    const filtered = catalog().filter(
      (nft) =>
        (inTab?.(nft) ?? true) &&
        (params.get(param.featured) !== 'true' || nft.featured) &&
        (!search ||
          normalize(`${nft.name} ${nft.collection.name} ${nft.creator.name} ${nft.description}`).includes(
            search,
          )) &&
        (collections.length === 0 || collections.includes(nft.collection.id)) &&
        (networks.length === 0 || networks.includes(nft.network)) &&
        (!minPrice || !isEth(minPrice) || compareEth(referencePrice(nft), minPrice) >= 0) &&
        (!maxPrice || !isEth(maxPrice) || compareEth(referencePrice(nft), maxPrice) <= 0),
    )

    const sorted = [...filtered].sort(sort)
    const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize))
    const page = Math.min(positiveInt(params.get(param.page), 1), totalPages)
    const body: PageDto<NftDto> = {
      items: sorted.slice((page - 1) * pageSize, page * pageSize),
      page,
      pageSize,
      total: sorted.length,
      totalPages,
    }
    return commitJson(body)
  }),

  /** Opções dos filtros na ordem do Figma, com contagens reais do catálogo. */
  route('get', '/nfts/facets', () => {
    const nfts = catalog()
    const prices = nfts.map(referencePrice).sort(compareEth)
    const body: CatalogFacetsDto = {
      collections: fixtureCollections.map(({ id, name }) => ({
        id,
        label: name,
        count: nfts.filter((nft) => nft.collection.id === id).length,
      })),
      networks: fixtureNetworks.map(({ id, name }) => ({
        id,
        label: name,
        count: nfts.filter((nft) => nft.network === id).length,
      })),
      priceRange: { minEth: prices[0] ?? '0', maxEth: prices.at(-1) ?? '0' },
    }
    return commitJson(body)
  }),

  /** Avaliações de colecionadores: determinísticas por NFT, mais recentes primeiro. */
  route('get', '/nfts/:id/reviews', ({ params }) => {
    const nft = params.id ? db.findNft(params.id) : undefined
    if (!nft) throw new ApiError(404, 'NFT_NOT_FOUND', 'NFT não encontrado')
    const items = createFixtureReviews(nft).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    const body: NftReviewsDto = { items, total: items.length }
    return commitJson(body)
  }),

  route('get', '/nfts/:id', ({ params }) => {
    const nft = params.id ? db.findNft(params.id) : undefined
    if (!nft) throw new ApiError(404, 'NFT_NOT_FOUND', 'NFT não encontrado')
    return commitJson(nft)
  }),
]
