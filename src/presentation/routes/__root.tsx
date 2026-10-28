import { createRootRouteWithContext, Outlet, useRouterState } from '@tanstack/react-router'
import { useEffect, useState } from 'react'

import type { RouterContext } from '@main/router'
import { RealtimeIndicator } from '@presentation/components/feedback/realtime-indicator'
import { MobileTabBar } from '@presentation/components/layout/mobile-tab-bar'
import { SiteFooter } from '@presentation/components/layout/site-footer'
import { SiteHeader } from '@presentation/components/layout/site-header'
import type { AppToasterProps } from '@presentation/components/ui/sonner'
import { lazyWithRetry } from '@presentation/lib/lazy-with-retry'
import { cn } from '@presentation/lib/utils'
import {
  FALLBACK_REGION_ID,
  markToasterMounted,
  preloadNotifications,
  registerToasterHost,
} from '@presentation/lib/notify'
import { NotFoundScreen } from '@presentation/screens/not-found-screen'
import { RouteErrorScreen } from '@presentation/screens/route-error-screen'

// Toaster fora do caminho crítico; se o chunk falhar, os avisos usam a região aria-live abaixo.
const Toaster = lazyWithRetry<AppToasterProps>(
  () => import('@presentation/components/ui/sonner').then((module) => ({ default: module.Toaster })),
  { errorFallback: null },
)

/** Abaixo da barra superior do detalhe mobile (voltar/favoritar). */
const TOAST_MOBILE_TOP_OFFSET = 80

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
  notFoundComponent: NotFoundScreen,
  // Falha ao carregar o código de uma rota (ex.: offline) ou erro inesperado da tela.
  errorComponent: RouteErrorScreen,
})

/**
 * Telas mobile do Figma sem rodapé: login e cadastro (telas próprias), carrinho
 * e pagamento (painel fixo na base, que cobriria o rodapé).
 */
const NO_MOBILE_FOOTER_PATHS = ['/login', '/cadastro', '/carrinho', '/checkout']

/** Frame do Figma: 24 px no topo, cabeçalho, 32 px até o conteúdo e 96 px entre seções. */
function RootLayout() {
  // Recibo (Figma Confirmação de Pedido): modal isolado sobre o fundo, sem cabeçalho nem rodapé.
  const isolated = useRouterState({ select: (state) => state.location.pathname.startsWith('/pedidos/') })
  const routeLoading = useRouterState({ select: (state) => state.status === 'pending' })
  const hideMobileFooter = useRouterState({
    select: (state) => NO_MOBILE_FOOTER_PATHS.includes(state.location.pathname),
  })
  // O Toaster monta depois do carregamento inicial ou no primeiro aviso (ver `notify.ts`).
  const [toasterMounted, setToasterMounted] = useState(false)
  useEffect(() => {
    const mount = () => {
      setToasterMounted(true)
    }
    const unregister = registerToasterHost(mount)
    preloadNotifications(mount)
    return unregister
  }, [])

  return (
    <div className="flex min-h-dvh flex-col pt-6">
      <a
        href="#conteudo"
        className="sr-only z-50 rounded-sm bg-primary px-4 py-2 font-bold text-primary-foreground focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        Pular para o conteúdo
      </a>
      {isolated ? null : <SiteHeader />}
      {/* Altura mínima de uma tela só enquanto a rota carrega (o rodapé não aparece para depois ser empurrado, CLS); carregada, a página termina onde o Figma termina. */}
      <main
        id="conteudo"
        tabIndex={-1}
        className={cn('flex-1 outline-none md:pt-8', routeLoading && 'min-h-dvh')}
      >
        <Outlet />
      </main>
      {isolated ? null : (
        <div className={cn('mt-12 md:mt-24', hideMobileFooter && 'max-md:hidden')}>
          <SiteFooter />
        </div>
      )}
      <MobileTabBar />
      <RealtimeIndicator />
      {/* No mobile o topo tem voltar/favoritar: o toast desce abaixo dessa faixa para não cobrir os botões. */}
      {toasterMounted ? (
        <Toaster.Component
          position="top-center"
          mobileOffset={{ top: TOAST_MOBILE_TOP_OFFSET }}
          onMounted={markToasterMounted}
        />
      ) : null}
      {/* Avisos quando o módulo de toasts não pôde ser baixado (offline). */}
      <div
        id={FALLBACK_REGION_ID}
        aria-live="assertive"
        aria-atomic="true"
        className="fixed inset-x-4 top-4 z-50 mx-auto max-w-md rounded-sm border border-border bg-popover px-4 py-3 text-center text-body-sm text-popover-foreground shadow-field empty:hidden"
      />
    </div>
  )
}
