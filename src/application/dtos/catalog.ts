import type { NftNetwork } from '@domain/entities/nft'

export const catalogSorts = ['recent', 'price-asc', 'price-desc', 'name-asc'] as const
export type CatalogSort = (typeof catalogSorts)[number]

/** Abas do Início: todos, lançados recentemente, em alta. */
export const catalogTabs = ['todos', 'novos', 'em-alta'] as const
export type CatalogTab = (typeof catalogTabs)[number]

export const DEFAULT_CATALOG_SORT: CatalogSort = 'recent'
export const DEFAULT_CATALOG_TAB: CatalogTab = 'todos'
/** Grid 3x3 do Figma. */
export const DEFAULT_PAGE_SIZE = 9

export const isCatalogSort = (value: string): value is CatalogSort =>
  (catalogSorts as readonly string[]).includes(value)

export const isCatalogTab = (value: string): value is CatalogTab =>
  (catalogTabs as readonly string[]).includes(value)

/** Parâmetros da listagem; espelham os search params da rota de início. */
export type CatalogQuery = {
  readonly search: string
  readonly collections: readonly string[]
  readonly networks: readonly NftNetwork[]
  readonly minPriceEth: string | null
  readonly maxPriceEth: string | null
  readonly tab: CatalogTab
  /** `null` = ordenação padrão da aba (recentes; "em alta" ordena por tendência). */
  readonly sort: CatalogSort | null
  readonly page: number
  readonly pageSize: number
}

export type Page<T> = {
  readonly items: readonly T[]
  readonly page: number
  readonly pageSize: number
  readonly total: number
  readonly totalPages: number
}

export type FacetOption = {
  readonly id: string
  readonly label: string
  readonly count: number
}

export type CatalogFacets = {
  /** Coleções do Figma, na ordem exibida. */
  readonly collections: readonly FacetOption[]
  /** Ethereum, Polygon, Solana. */
  readonly networks: readonly FacetOption[]
  readonly priceRange: { readonly minEth: string; readonly maxEth: string }
}
