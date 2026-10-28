import type { Session } from '@domain/entities/session'

import { ApplicationError, isApplicationError } from '@application/errors/application-error'
import type { AuthGateway } from '@application/ports/gateways/auth.gateway'
import type { SessionStorage } from '@application/ports/services/session-storage'
import type { SessionState } from '@application/services/session-state'

/**
 * Renova os tokens da sessão. Chamadas simultâneas compartilham a mesma
 * renovação. Se o servidor recusar, a sessão expira; a interface preserva o
 * contexto levando ao login com retorno.
 */
export class RefreshSessionUseCase {
  private inFlight: Promise<Session> | null = null

  private readonly auth: AuthGateway
  private readonly state: SessionState
  private readonly storage: SessionStorage

  constructor(auth: AuthGateway, state: SessionState, storage: SessionStorage) {
    this.auth = auth
    this.state = state
    this.storage = storage
  }

  execute(): Promise<Session> {
    this.inFlight ??= this.refresh().finally(() => {
      this.inFlight = null
    })
    return this.inFlight
  }

  private async refresh(): Promise<Session> {
    const current = this.state.current
    if (!current) throw new ApplicationError('UNAUTHENTICATED', 'Sessão encerrada', { status: 401 })

    try {
      const renewed = await this.auth.refresh(current.refreshToken)
      // Usuário saiu ou trocou de conta durante a renovação: resultado descartado.
      if (this.state.getSnapshot().session?.user.id !== current.user.id) {
        throw new ApplicationError('CANCELED', 'Sessão alterada durante a renovação')
      }
      this.storage.save(renewed)
      this.state.set(renewed)
      return renewed
    } catch (error) {
      if (isApplicationError(error) && error.code === 'UNAUTHENTICATED' && this.state.current === current) {
        this.storage.clear()
        this.state.end('expired')
      }
      throw error
    }
  }
}
