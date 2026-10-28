import { QueryClient } from '@tanstack/react-query'

import { isApplicationError } from '@application/errors/application-error'

const MAX_QUERY_RETRIES = 2

/**
 * Política padrão de cache e retry (detalhada em ARCHITECTURE.md):
 * - consultas repetem só falhas transitórias, com backoff exponencial;
 * - mutations nunca repetem automaticamente (reenvio só com chave de idempotência);
 * - dados públicos ficam frescos por 30 s; eventos em tempo real atualizam o cache.
 */
export const createQueryClient = (): QueryClient =>
  new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        gcTime: 5 * 60_000,
        refetchOnWindowFocus: false,
        retry: (failureCount, error) =>
          failureCount < MAX_QUERY_RETRIES && isApplicationError(error) && error.isRetryable,
        retryDelay: (attempt) => Math.min(500 * 2 ** attempt, 4_000),
      },
      mutations: {
        retry: false,
      },
    },
  })
