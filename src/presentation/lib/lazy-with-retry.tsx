import { lazy, Suspense, useState, type ComponentType, type ReactNode } from 'react'

import { LoadErrorBoundary } from '@presentation/components/feedback/load-error-boundary'

type LazyOptions<P> = {
  /**
   * Enquanto o chunk baixa (mesmas dimensões do conteúdo, quando visível).
   * Pode depender das props (ex.: o próprio botão que abre o componente).
   */
  readonly fallback?: ReactNode | ((props: P) => ReactNode)
  /** Quando o chunk falha; omitido mostra "Tentar de novo". */
  readonly errorFallback?: ReactNode
}

/**
 * `React.lazy` com recuperação: uma falha de download (offline) não fica
 * memorizada; "Tentar de novo" cria um novo lazy e baixa outra vez.
 * `preload` permite antecipar o download (hover/foco do botão que abre).
 */
export const lazyWithRetry = <P extends object>(
  factory: () => Promise<{ default: ComponentType<P> }>,
  { fallback = null, errorFallback }: LazyOptions<P> = {},
) => {
  let pending: Promise<{ default: ComponentType<P> }> | null = null
  const load = () => {
    pending ??= factory().catch((error: unknown) => {
      pending = null
      throw error
    })
    return pending
  }

  function LazyComponent(props: P) {
    const [Loaded, setLoaded] = useState(() => lazy(load))
    const [attempt, setAttempt] = useState(0)

    return (
      <LoadErrorBoundary
        key={attempt}
        {...(errorFallback !== undefined ? { fallback: errorFallback } : {})}
        onRetry={() => {
          setLoaded(() => lazy(load))
          setAttempt((current) => current + 1)
        }}
      >
        <Suspense fallback={typeof fallback === 'function' ? fallback(props) : fallback}>
          <Loaded {...props} />
        </Suspense>
      </LoadErrorBoundary>
    )
  }

  return {
    Component: LazyComponent,
    preload: () => {
      load().catch(() => undefined)
    },
  }
}
