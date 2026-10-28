import { validateRegistration } from '@domain/entities/profile'
import type { Session } from '@domain/entities/session'

import type { RegisterInput } from '@application/dtos/inputs'
import { assertValid } from '@application/errors/validation'
import type { AuthGateway } from '@application/ports/gateways/auth.gateway'
import type { SessionStorage } from '@application/ports/services/session-storage'
import type { SessionState } from '@application/services/session-state'
import type { MergeGuestCartUseCase } from '@application/use-cases/cart/merge-guest-cart.use-case'

export class RegisterUseCase {
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

  async execute(input: RegisterInput): Promise<Session> {
    const normalized = {
      name: input.name.trim(),
      email: input.email.trim().toLowerCase(),
      password: input.password,
    }
    assertValid(
      validateRegistration({
        ...normalized,
        ...(input.confirmPassword !== undefined ? { confirmPassword: input.confirmPassword } : {}),
      }),
    )

    const session = await this.auth.register(normalized)
    this.storage.save(session)
    this.state.set(session)
    await this.mergeGuestCart.execute()
    return session
  }
}
