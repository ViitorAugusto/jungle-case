import type { QueryClient } from '@tanstack/react-query'
import { createRouter } from '@tanstack/react-router'

import type { SessionState } from '@application/services/session-state'

import { parseSearch, stringifySearch } from '@main/search-serializer'
import { routeTree } from '@presentation/route-tree.gen'

export type RouterContext = {
  readonly queryClient: QueryClient
  /** Sessão corrente para guardas de rota (`beforeLoad` das rotas privadas). */
  readonly sessionState: SessionState
}

export const createAppRouter = (context: RouterContext) =>
  createRouter({
    routeTree,
    context,
    defaultPreload: 'intent',
    defaultPreloadStaleTime: 0,
    scrollRestoration: true,
    parseSearch,
    stringifySearch,
  })

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof createAppRouter>
  }
}
