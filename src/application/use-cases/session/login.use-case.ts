import { validateEmail } from '@domain/entities/profile'
import type { Session } from '@domain/entities/session'

import type { LoginInput } from '@application/dtos/inputs'
import { assertValid } from '@application/errors/validation'
import type { AuthGateway } from '@application/ports/gateways/auth.gateway'
import type { SessionStorage } from '@application/ports/services/session-storage'
import type { SessionState } from '@application/services/session-state'
import type { MergeGuestCartUseCase } from '@application/use-cases/cart/merge-guest-cart.use-case'

export class LoginUseCase {
  private readonly auth: AuthGateway
  private readonly state: SessionState
  private readonly storage: SessionStorage
  private readonly mergeGuestCart: MergeGuestCartUseCase

  constructor(
    auth: AuthGateway,
    state: SessionState,
    storage: SessionStorage,
    mergeGuestCart: MergeGuestCartUseCase,
  ) {
    this.auth = auth
    this.state = state
    this.storage = storage
    this.mergeGuestCart = mergeGuestCart
  }

  async execute(input: LoginInput): Promise<Session> {
    const email = input.email.trim().toLowerCase()
    const emailErrors = validateEmail(email)
    assertValid({
      ...(emailErrors.length > 0 ? { email: emailErrors } : {}),
      ...(input.password ? {} : { password: ['Informe a senha'] }),
    })

    const session = await this.auth.login(email, input.password)
    this.storage.save(session)
    this.state.set(session)
    await this.mergeGuestCart.execute()
    return session
  }
}
