import type { AxiosInstance } from 'axios'

import type { Profile } from '@domain/entities/profile'
import type { ValidWalletDraft, Wallet, WalletProvider, WalletSlot } from '@domain/entities/wallet'

import type { RequestOptions } from '@application/ports/gateways/catalog.gateway'
import type { ProfileGateway } from '@application/ports/gateways/profile.gateway'
import type { WalletGateway } from '@application/ports/gateways/wallet.gateway'

import {
  apiRoutes,
  type ChangePasswordRequest,
  type ConnectWalletRequest,
  type ProfileDto,
  type SaveWalletRequest,
  type UpdateAvatarRequest,
  type UpdateProfileRequest,
  type WalletDto,
  type WalletsDto,
} from '@adapters/http/contracts'
import { toProfile, toWallet } from '@adapters/mappers/api.mapper'

export class HttpProfileGateway implements ProfileGateway {
  private readonly http: AxiosInstance

  constructor(http: AxiosInstance) {
    this.http = http
  }

  async get(options: RequestOptions = {}): Promise<Profile> {
    const { data } = await this.http.get<ProfileDto>(apiRoutes.profile, { ...options })
    return toProfile(data)
  }

  async update(input: UpdateProfileRequest): Promise<Profile> {
    const { data } = await this.http.patch<ProfileDto>(apiRoutes.profile, input)
    return toProfile(data)
  }

  async updateAvatar(dataUrl: string): Promise<Profile> {
    const body: UpdateAvatarRequest = { dataUrl }
    const { data } = await this.http.put<ProfileDto>(apiRoutes.avatar, body)
    return toProfile(data)
  }

  async removeAvatar(): Promise<Profile> {
    const { data } = await this.http.delete<ProfileDto>(apiRoutes.avatar)
    return toProfile(data)
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    const body: ChangePasswordRequest = { currentPassword, newPassword }
    await this.http.put(apiRoutes.password, body)
  }
}

export class HttpWalletGateway implements WalletGateway {
  private readonly http: AxiosInstance

  constructor(http: AxiosInstance) {
    this.http = http
  }

  async list(options: RequestOptions = {}): Promise<readonly Wallet[]> {
    const { data } = await this.http.get<WalletsDto>(apiRoutes.wallets, { ...options })
    return data.items.map(toWallet)
  }

  async save(slot: WalletSlot, input: ValidWalletDraft): Promise<Wallet> {
    const body: SaveWalletRequest = input
    const { data } = await this.http.put<WalletDto>(apiRoutes.wallet(slot), body)
    return toWallet(data)
  }

  async remove(slot: WalletSlot): Promise<void> {
    await this.http.delete(apiRoutes.wallet(slot))
  }

  async connect(slot: WalletSlot, provider: WalletProvider): Promise<Wallet> {
    const body: ConnectWalletRequest = { provider }
    const { data } = await this.http.post<WalletDto>(apiRoutes.walletConnect(slot), body)
    return toWallet(data)
  }

  async disconnect(slot: WalletSlot): Promise<Wallet> {
    const { data } = await this.http.post<WalletDto>(apiRoutes.walletDisconnect(slot))
    return toWallet(data)
  }
}
