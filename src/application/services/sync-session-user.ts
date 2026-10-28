import type { Profile } from '@domain/entities/profile'

import type { SessionStorage } from '@application/ports/services/session-storage'
import type { SessionState } from '@application/services/session-state'

/** Mantém nome, e-mail e avatar da sessão iguais ao perfil salvo. */
export const syncSessionUser = (state: SessionState, storage: SessionStorage, profile: Profile): void => {
  const session = state.current
  if (session?.user.id !== profile.id) return
  const updated = {
    ...session,
    user: { ...session.user, name: profile.displayName, email: profile.email, avatarUrl: profile.avatarUrl },
  }
  storage.save(updated)
  state.set(updated)
}
