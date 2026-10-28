import type { CatalogSort, CatalogTab } from '@application/dtos'

/** Rótulos do Figma para as abas do catálogo. */
export const catalogTabLabels: Record<CatalogTab, string> = {
  todos: 'Todos os NFTs',
  novos: 'Novos lançamentos',
  'em-alta': 'Em alta',
}

/** "Listados recentemente" vem do Figma; as demais opções seguem o mesmo tom. */
export const catalogSortLabels: Record<CatalogSort, string> = {
  recent: 'Listados recentemente',
  'price-asc': 'Menor preço',
  'price-desc': 'Maior preço',
  'name-asc': 'Nome (A–Z)',
}
