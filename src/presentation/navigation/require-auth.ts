import { redirect, type ParsedLocation } from '@tanstack/react-router'

import type { RouterContext } from '@main/router'

export const LOGIN_PATH = '/login'

type GuardArgs = {
  readonly context: RouterContext
  readonly location: ParsedLocation
}

/** Endereço do login que devolve o usuário para `returnTo` depois de entrar. */
export const loginHref = (returnTo: string, expired: boolean): string => {
  const params = new URLSearchParams({ redirect: returnTo })
  if (expired) params.set('expired', '1')
  return `${LOGIN_PATH}?${params.toString()}`
}

/**
 * `beforeLoad` das rotas privadas: sem sessão, leva ao login guardando a rota
 * atual (com busca e hash). Se a sessão acabou de expirar, o login mostra o aviso.
 * Também roda de novo quando a sessão termina com a tela aberta (o router é
 * invalidado na troca de usuário).
 */
export const requireAuth = ({ context, location }: GuardArgs): void => {
  const { session, endedReason } = context.sessionState.getSnapshot()
  if (session) return
  // eslint-disable-next-line @typescript-eslint/only-throw-error -- contrato do TanStack Router
  throw redirect({ href: loginHref(location.href, endedReason === 'expired'), replace: true })
}
