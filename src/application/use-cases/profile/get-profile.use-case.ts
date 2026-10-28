import type { Profile } from '@domain/entities/profile'

import type { RequestOptions } from '@application/ports/gateways/catalog.gateway'
import type { ProfileGateway } from '@application/ports/gateways/profile.gateway'
import type { SessionState } from '@application/services/session-state'
import { requireSession } from '@application/services/require-session'

export class GetProfileUseCase {
  private readonly profiles: ProfileGateway
  private readonly session: SessionState

  constructor(profiles: ProfileGateway, session: SessionState) {
    this.profiles = profiles
    this.session = session
  }

  execute(options?: RequestOptions): Promise<Profile> {
    requireSession(this.session)
    return this.profiles.get(options)
  }
}
