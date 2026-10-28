import type { Profile } from '@domain/entities/profile'

import type { ProfileGateway } from '@application/ports/gateways/profile.gateway'
import type { SessionStorage } from '@application/ports/services/session-storage'
import type { SessionState } from '@application/services/session-state'
import { syncSessionUser } from '@application/services/sync-session-user'
import { requireSession } from '@application/services/require-session'

/** "Remover" do avatar: o perfil volta sem foto (`avatarUrl = null`). */
export class RemoveAvatarUseCase {
  private readonly profiles: ProfileGateway
  private readonly session: SessionState
  private readonly storage: SessionStorage

  constructor(profiles: ProfileGateway, session: SessionState, storage: SessionStorage) {
    this.profiles = profiles
    this.session = session
    this.storage = storage
  }

  async execute(): Promise<Profile> {
    requireSession(this.session)
    const profile = await this.profiles.removeAvatar()
    syncSessionUser(this.session, this.storage, profile)
    return profile
  }
}
