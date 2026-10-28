import { isSessionExpired, type Session } from '@domain/entities/session'

import type { Clock } from '@application/ports/services/clock'
import type { SessionStorage } from '@application/ports/services/session-storage'
import type { SessionState } from '@application/services/session-state'

/** Recupera a sessão guardada após refresh. Token de acesso vencido é renovado na primeira chamada. */
export class RestoreSessionUseCase {
  private readonly state: SessionState
  private readonly storage: SessionStorage
  private readonly clock: Clock

  constructor(state: SessionState, storage: SessionStorage, clock: Clock) {
    this.state = state
    this.storage = storage
    this.clock = clock
  }

  execute(): Session | null {
    const stored = this.storage.load()
    if (!stored) return null
    if (isSessionExpired(stored, this.clock.now())) {
      this.storage.clear()
      return null
    }
    this.state.set(stored)
    return stored
  }
}
