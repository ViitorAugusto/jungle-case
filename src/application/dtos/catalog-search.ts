import { isNftNetwork, type NftNetwork } from '@domain/entities/nft'
import { EthAmount } from '@domain/value-objects/eth-amount'

import {
  DEFAULT_CATALOG_SORT,
  DEFAULT_CATALOG_TAB,
  DEFAULT_PAGE_SIZE,
  isCatalogSort,
  isCatalogTab,
  type CatalogQuery,
  type CatalogSort,
  type CatalogTab,
} from '@application/dtos/catalog'

/**
 * Forma dos search params da listagem na URL. Só aparecem as chaves diferentes
 * do padrão, para que a URL fique curta e estável entre refresh e histórico.
 */
export type CatalogSearch = {
  readonly q?: string
  readonly collection?: readonly string[]
  readonly network?: readonly NftNetwork[]
  readonly min?: string
  readonly max?: string
  readonly tab?: CatalogTab
  readonly sort?: CatalogSort
  readonly page?: number
}

/** Chaves que, ao mudar, devolvem a listagem para a página 1 (`undefined` limpa o filtro). */
export type CatalogFilters = {
  readonly [K in Exclude<keyof CatalogSearch, 'page'>]?: CatalogSearch[K] | undefined
}

const MAX_SEARCH_LENGTH = 80

const asString = (value: unknown): string | undefined => {
  if (typeof value === 'string') return value.trim() || undefined
  if (typeof value === 'number') return String(value)
  return undefined
}

const asList = (value: unknown): string[] => {
  const items = (Array.isArray(value) ? value : [value])
    .map(asString)
    .filter((item): item is string => item !== undefined)
  return [...new Set(items)].sort()
}

const nonEmpty = <T>(items: readonly T[]): readonly T[] | undefined => (items.length > 0 ? items : undefined)

/** Aceita ponto ou vírgula decimal ("0,02"), como o Figma exibe. */
const asPrice = (value: unknown): string | undefined => {
  const text = asString(value)?.replace(',', '.')
  if (!text || !EthAmount.isValid(text)) return undefined
  const amount = EthAmount.of(text)
  return amount.isNegative() ? undefined : amount.toString()
}

const asPage = (value: unknown): number | undefined => {
  const page = typeof value === 'number' ? value : Number(asString(value))
  return Number.isSafeInteger(page) && page > 1 ? page : undefined
}

const asSort = (value: unknown): CatalogSort | undefined => {
  const sort = asString(value)
  return sort && isCatalogSort(sort) ? sort : undefined
}

const asTab = (value: unknown): CatalogTab | undefined => {
  const tab = asString(value)
  return tab && isCatalogTab(tab) && tab !== DEFAULT_CATALOG_TAB ? tab : undefined
}

const compact = (search: Record<string, unknown>): CatalogSearch =>
  Object.fromEntries(Object.entries(search).filter(([, value]) => value !== undefined))

/** `validateSearch` da rota: aceita qualquer entrada da URL e devolve parâmetros válidos. */
export const parseCatalogSearch = (raw: Record<string, unknown>): CatalogSearch => {
  let min = asPrice(raw.min)
  let max = asPrice(raw.max)
  if (min && max && EthAmount.of(min).compare(EthAmount.of(max)) > 0) [min, max] = [max, min]

  return compact({
    q: asString(raw.q)?.slice(0, MAX_SEARCH_LENGTH),
    collection: nonEmpty(asList(raw.collection)),
    network: nonEmpty(asList(raw.network).filter(isNftNetwork)),
    min,
    max,
    tab: asTab(raw.tab),
    sort: asSort(raw.sort),
    page: asPage(raw.page),
  })
}

/** Aplica mudanças de filtro, busca, aba ou ordenação e volta para a página 1. */
export const applyCatalogFilters = (current: CatalogSearch, changes: CatalogFilters): CatalogSearch =>
  parseCatalogSearch({ ...current, ...changes, page: undefined })

export const withCatalogPage = (current: CatalogSearch, page: number): CatalogSearch =>
  parseCatalogSearch({ ...current, page })

/** Ordenação efetiva exibida no seletor ("Listados recentemente" por padrão). */
export const effectiveCatalogSort = (search: CatalogSearch): CatalogSort =>
  search.sort ?? DEFAULT_CATALOG_SORT

export const toCatalogQuery = (search: CatalogSearch, pageSize = DEFAULT_PAGE_SIZE): CatalogQuery => ({
  search: search.q ?? '',
  collections: search.collection ?? [],
  networks: search.network ?? [],
  minPriceEth: search.min ?? null,
  maxPriceEth: search.max ?? null,
  tab: search.tab ?? DEFAULT_CATALOG_TAB,
  sort: search.sort ?? null,
  page: search.page ?? 1,
  pageSize,
})
