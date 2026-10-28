import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query'

import { toCatalogQuery, type CatalogSearch } from '@application/dtos'

import { catalogQueries } from '@main/query/catalog-queries'

/**
 * Listagem pelos search params da rota. Cada combinação de parâmetros é uma
 * chave própria; trocar de filtro cancela a consulta anterior (AbortSignal) e
 * mantém a página anterior visível enquanto a nova carrega (`isPlaceholderData`).
 * `pageSize` padrão 9 (grid 3x3 do Figma).
 */
export const useCatalog = (search: CatalogSearch, options: { readonly pageSize?: number } = {}) =>
  useQuery({
    ...catalogQueries.list(toCatalogQuery(search, options.pageSize)),
    placeholderData: keepPreviousData,
  })

export const useFeaturedNfts = () => useQuery(catalogQueries.featured())

export const useCatalogFacets = () => useQuery(catalogQueries.facets())

/** Detalhe do NFT. `error.code === 'NOT_FOUND'` indica NFT inexistente. */
export const useNft = (id: string) => {
  const queryClient = useQueryClient()
  return useQuery(catalogQueries.nft(queryClient, id))
}
