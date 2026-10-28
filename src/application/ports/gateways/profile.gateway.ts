import type { Profile, ProfileDraft } from '@domain/entities/profile'

import type { RequestOptions } from '@application/ports/gateways/catalog.gateway'

export interface ProfileGateway {
  get(options?: RequestOptions): Promise<Profile>
  update(input: ProfileDraft): Promise<Profile>
  updateAvatar(dataUrl: string): Promise<Profile>
  removeAvatar(): Promise<Profile>
  changePassword(currentPassword: string, newPassword: string): Promise<void>
}
