import type { QueryClient } from '@tanstack/react-query'

import type { SessionState } from '@application/services/session-state'
import type { RealtimeSync } from '@application/services/realtime-sync'

import { queryKeys } from '@main/query/query-keys'

type SessionRuntimeDeps = {
  readonly sessionState: SessionState
  readonly queryClient: QueryClient
  readonly realtime: RealtimeSync
}

/**
 * Reage à troca de usuário (login, logout, expiração, troca de conta) de forma
 * síncrona, antes de qualquer render com o novo usuário:
 * 1. fecha a conexão em tempo real da sessão anterior (listeners removidos);
 * 2. cancela e remove todo o cache privado e mutations em andamento;
 * 3. descarta o carrinho de visitante (mesclado no login ou recomeçado no logout);
 * 4. abre a conexão da nova sessão (ou anônima, só eventos públicos).
 * Renovação de token do mesmo usuário não reinicia nada.
 */
export const startSessionRuntime = ({
  sessionState,
  queryClient,
  realtime,
}: SessionRuntimeDeps): (() => void) => {
  realtime.start(sessionState.current?.accessToken ?? null)

  const unsubscribe = sessionState.subscribe((next, previous) => {
    const previousUserId = previous.session?.user.id ?? null
    const nextUserId = next.session?.user.id ?? null
    if (previousUserId === nextUserId) return

    realtime.stop()
    void queryClient.cancelQueries({ queryKey: queryKeys.allPrivate })
    queryClient.removeQueries({ queryKey: queryKeys.allPrivate })
    queryClient.getMutationCache().clear()
    queryClient.removeQueries({ queryKey: queryKeys.guest })
    realtime.start(next.session?.accessToken ?? null)
  })

  return () => {
    unsubscribe()
    realtime.stop()
  }
}
