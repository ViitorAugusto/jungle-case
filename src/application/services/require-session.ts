import type { Session } from '@domain/entities/session'

import { ApplicationError } from '@application/errors/application-error'
import type { SessionState } from '@application/services/session-state'

/** Operações privadas falham cedo, sem ir à rede, quando não há sessão. */
export const requireSession = (state: SessionState): Session => {
  const session = state.current
  if (!session)
    throw new ApplicationError('UNAUTHENTICATED', 'Entre na sua conta para continuar', { status: 401 })
  return session
}
