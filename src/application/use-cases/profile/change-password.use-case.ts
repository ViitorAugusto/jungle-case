import { validatePasswordChange } from '@domain/entities/profile'

import type { PasswordChangeInput } from '@application/dtos/inputs'
import { assertValid } from '@application/errors/validation'
import type { ProfileGateway } from '@application/ports/gateways/profile.gateway'
import type { SessionState } from '@application/services/session-state'
import { requireSession } from '@application/services/require-session'

export class ChangePasswordUseCase {
  private readonly profiles: ProfileGateway
  private readonly session: SessionState

  constructor(profiles: ProfileGateway, session: SessionState) {
    this.profiles = profiles
    this.session = session
  }

  async execute(input: PasswordChangeInput): Promise<void> {
    requireSession(this.session)
    assertValid(validatePasswordChange(input))
    await this.profiles.changePassword(input.currentPassword, input.newPassword)
  }
}
