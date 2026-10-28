import type { AuthGateway } from '@application/ports/gateways/auth.gateway'
import type { SessionStorage } from '@application/ports/services/session-storage'
import type { SessionState } from '@application/services/session-state'

/**
 * Encerra a sessão. A sessão local termina mesmo se a API falhar, então o
 * usuário nunca fica preso logado. Quem observa o `SessionState` limpa o
 * cache privado e fecha a conexão em tempo real.
 */
export class LogoutUseCase {
  private readonly auth: AuthGateway
  private readonly state: SessionState
  private readonly storage: SessionStorage

  constructor(auth: AuthGateway, state: SessionState, storage: SessionStorage) {
    this.auth = auth
    this.state = state
    this.storage = storage
  }

  async execute(): Promise<void> {
    if (!this.state.current) return
    try {
      await this.auth.logout()
    } catch {
      // Revogação no servidor é melhor esforço; o fim da sessão local não depende dela.
    } finally {
      this.storage.clear()
      this.state.end('logout')
    }
  }
}
