import type { SessionStorage } from '@application/ports/services/session-storage'
import type { SessionState } from '@application/services/session-state'

/** A API declarou a sessão inválida: encerra localmente marcando o motivo. */
export class ExpireSessionUseCase {
  private readonly state: SessionState
  private readonly storage: SessionStorage

  constructor(state: SessionState, storage: SessionStorage) {
    this.state = state
    this.storage = storage
  }

  execute(): void {
    if (!this.state.current) return
    this.storage.clear()
    this.state.end('expired')
  }
}
