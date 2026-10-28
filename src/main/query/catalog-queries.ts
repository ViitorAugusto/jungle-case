import { queryOptions, type QueryClient } from '@tanstack/react-query'

import { isNewerVersion, type CatalogQuery, type Nft } from '@application/dtos'

import { container } from '@main/container'
import { queryKeys } from '@main/query/query-keys'

const { catalog } = container

/**
 * Opções das consultas públicas do catálogo. Fonte única para os hooks da
 * interface e para o prefetch dos loaders de rota, que precisam da mesma
 * chave para o dado buscado no loader servir à tela.
 */
export const catalogQueries = {
  list: (query: CatalogQuery) =>
    queryOptions({
      queryKey: queryKeys.catalogList(query),
      queryFn: ({ signal }) => catalog.list.execute(query, { signal }),
    }),

  featured: () =>
    queryOptions({
      queryKey: queryKeys.featured,
      queryFn: ({ signal }) => catalog.featured.execute({ signal }),
    }),

  facets: () =>
    queryOptions({
      queryKey: queryKeys.facets,
      queryFn: ({ signal }) => catalog.facets.execute({ signal }),
      staleTime: 5 * 60_000,
    }),

  nft: (queryClient: QueryClient, id: string) =>
    queryOptions({
      queryKey: queryKeys.nft(id),
      queryFn: async ({ signal }) => {
        const fetched = await catalog.detail.execute(id, { signal })
        // Resposta REST mais antiga que um evento já aplicado não regride o cache.
        const cached = queryClient.getQueryData<Nft>(queryKeys.nft(id))
        return cached && isNewerVersion(fetched, cached.version) ? cached : fetched
      },
    }),
}
