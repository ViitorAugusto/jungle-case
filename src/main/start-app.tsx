import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { container } from '@main/container'
import { AppProviders } from '@main/providers/app-providers'
import { createAppRouter } from '@main/router'
import { startSessionRuntime } from '@main/session/session-runtime'

import '@presentation/styles/globals.css'

/** Monta a aplicação: sessão recuperada antes do primeiro render, tempo real ligado à sessão. */
export const startApp = (): void => {
  container.session.restore.execute()
  startSessionRuntime({
    sessionState: container.sessionState,
    queryClient: container.queryClient,
    realtime: container.realtime,
  })

  const { queryClient, sessionState } = container
  const router = createAppRouter({ queryClient, sessionState })
  // Sessão terminou (logout/expiração) ou trocou de usuário: as guardas das rotas
  // abertas rodam de novo e uma tela privada leva ao login com retorno.
  sessionState.subscribe((next, previous) => {
    if (next.session?.user.id !== previous.session?.user.id) void router.invalidate()
  })

  const root = document.getElementById('root')
  if (!root) throw new Error('Elemento #root não encontrado')

  createRoot(root).render(
    <StrictMode>
      <AppProviders queryClient={queryClient} router={router} />
    </StrictMode>,
  )
}
