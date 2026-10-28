import { normalizeProfileDraft, validateProfileDraft, type Profile } from '@domain/entities/profile'

import type { ProfileInput } from '@application/dtos/inputs'
import { assertValid } from '@application/errors/validation'
import type { ProfileGateway } from '@application/ports/gateways/profile.gateway'
import type { SessionStorage } from '@application/ports/services/session-storage'
import type { SessionState } from '@application/services/session-state'
import { syncSessionUser } from '@application/services/sync-session-user'
import { requireSession } from '@application/services/require-session'

export class UpdateProfileUseCase {
  private readonly profiles: ProfileGateway
  private readonly session: SessionState
  private readonly storage: SessionStorage

  constructor(profiles: ProfileGateway, session: SessionState, storage: SessionStorage) {
    this.profiles = profiles
    this.session = session
    this.storage = storage
  }

  async execute(input: ProfileInput): Promise<Profile> {
    requireSession(this.session)
    const draft = normalizeProfileDraft(input)
    assertValid(validateProfileDraft(draft))
    const profile = await this.profiles.update(draft)
    syncSessionUser(this.session, this.storage, profile)
    return profile
  }
}
