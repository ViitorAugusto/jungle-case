import { createFileRoute } from '@tanstack/react-router'

import { parseCatalogSearch, toCatalogQuery } from '@application/dtos'

import { catalogQueries } from '@main/query/catalog-queries'
import { HomeScreen } from '@presentation/screens/home-screen'

export const Route = createFileRoute('/')({
  // Busca, filtros, ordenação e página vivem na URL (refresh e histórico preservam).
  validateSearch: parseCatalogSearch,
  loaderDeps: ({ search }) => search,
  // Prefetch sem esperar: os dados saem junto com o código da tela, e a tela
  // continua cuidando de carregamento e erro.
  loader: ({ context: { queryClient }, deps }) => {
    void queryClient.query(catalogQueries.list(toCatalogQuery(deps))).catch(() => undefined)
    void queryClient.query(catalogQueries.featured()).catch(() => undefined)
  },
  component: HomeScreen,
})
