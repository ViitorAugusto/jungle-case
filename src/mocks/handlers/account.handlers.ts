import type {
  ChangePasswordRequest,
  ConnectWalletRequest,
  ProfileDto,
  SaveWalletRequest,
  UpdateAvatarRequest,
  UpdateProfileRequest,
  WalletDto,
  WalletsDto,
} from '@adapters/http/contracts'

import { db } from '@mocks/db/database'
import type { UserRecord } from '@mocks/db/fixtures'
import { ApiError, commitEmpty, commitJson, readJson, route, validationError } from '@mocks/http/respond'
import { scenarios } from '@mocks/scenarios/scenarios'
import { authenticate, hashPassword, verifyPassword } from '@mocks/services/auth'
import {
  isNetwork,
  isProvider,
  PROVIDERS,
  text,
  validateNewPassword,
  validateProfileFields,
  validateWalletFields,
} from '@mocks/services/validation'

const AVATAR_PATTERN = /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/
/** ~512 KB de imagem em base64. */
const AVATAR_MAX_CHARS = 700_000
const SLOTS = ['primary', 'secondary'] as const

const toProfileDto = (user: UserRecord): ProfileDto => ({
  id: user.id,
  displayName: user.name,
  username: user.username,
  email: user.email,
  ensName: user.ensName,
  walletNickname: user.walletNickname,
  avatarUrl: user.avatarUrl,
  updatedAt: user.updatedAt,
})

const forcedValidation = () => {
  if (scenarios.is('validation-error')) {
    throw validationError({ displayName: ['Dado recusado pelo servidor'] })
  }
}

const slotOrFail = (slot: string | undefined): WalletDto['slot'] => {
  const found = SLOTS.find((candidate) => candidate === slot)
  if (!found) throw new ApiError(404, 'WALLET_NOT_FOUND', 'Carteira não encontrada')
  return found
}

const walletOf = (userId: string, slot: WalletDto['slot']) => {
  const entry = db.state.wallets.find((item) => item.userId === userId && item.wallet.slot === slot)
  if (!entry) throw new ApiError(404, 'WALLET_NOT_FOUND', 'Carteira não cadastrada')
  return entry
}

export const accountHandlers = [
  route('get', '/profile', ({ request }) => commitJson(toProfileDto(authenticate(request).user))),

  route('patch', '/profile', async ({ request }) => {
    const { user } = authenticate(request)
    const body = (await readJson<UpdateProfileRequest>(request)) as Partial<Record<string, unknown>>
    const fields = {
      displayName: text(body.displayName),
      username: text(body.username).toLowerCase(),
      email: text(body.email).toLowerCase(),
      ensName: text(body.ensName).toLowerCase(),
      walletNickname: text(body.walletNickname),
    }
    forcedValidation()
    const fieldErrors = validateProfileFields(fields)
    if (Object.keys(fieldErrors).length > 0) throw validationError(fieldErrors)
    const others = db.state.users.filter((other) => other.id !== user.id)
    if (others.some((other) => other.email === fields.email)) {
      throw new ApiError(409, 'EMAIL_IN_USE', 'Este e-mail já está em uso', {
        email: ['Este e-mail já está em uso'],
      })
    }
    if (others.some((other) => other.username === fields.username)) {
      throw new ApiError(409, 'USERNAME_IN_USE', 'Este nome de usuário já está em uso', {
        username: ['Este nome de usuário já está em uso'],
      })
    }
    const { displayName, ...rest } = fields
    Object.assign(user, { ...rest, name: displayName, updatedAt: new Date().toISOString() })
    return commitJson(toProfileDto(user))
  }),

  route('put', '/profile/avatar', async ({ request }) => {
    const { user } = authenticate(request)
    const body = await readJson<UpdateAvatarRequest>(request)
    const dataUrl = body.dataUrl ?? ''
    forcedValidation()
    if (!AVATAR_PATTERN.test(dataUrl) || dataUrl.length > AVATAR_MAX_CHARS) {
      throw validationError({ avatar: ['Use uma imagem PNG, JPEG ou WebP de até 512 KB'] })
    }
    Object.assign(user, { avatarUrl: dataUrl, updatedAt: new Date().toISOString() })
    return commitJson(toProfileDto(user))
  }),

  /** "Remover" do avatar. */
  route('delete', '/profile/avatar', ({ request }) => {
    const { user } = authenticate(request)
    Object.assign(user, { avatarUrl: null, updatedAt: new Date().toISOString() })
    return commitJson(toProfileDto(user))
  }),

  route('put', '/profile/password', async ({ request }) => {
    const { user } = authenticate(request)
    const body = await readJson<ChangePasswordRequest>(request)
    forcedValidation()
    if (!(await verifyPassword(user, body.currentPassword ?? ''))) {
      throw new ApiError(422, 'CURRENT_PASSWORD_INVALID', 'Senha atual incorreta', {
        currentPassword: ['Senha atual incorreta'],
      })
    }
    const errors = validateNewPassword(body.newPassword ?? '')
    if (errors.length > 0) throw validationError({ newPassword: errors })
    user.salt = crypto.randomUUID()
    user.passwordHash = await hashPassword(user.salt, body.newPassword ?? '')
    user.updatedAt = new Date().toISOString()
    return commitEmpty()
  }),

  route('get', '/wallets', ({ request }) => {
    const { user } = authenticate(request)
    const body: WalletsDto = {
      items: db.state.wallets
        .filter((entry) => entry.userId === user.id)
        .map((entry) => entry.wallet)
        .sort((a, b) => a.slot.localeCompare(b.slot) * -1),
    }
    return commitJson(body)
  }),

  /**
   * Salva a carteira com os campos do pagamento (422 por campo). Manter
   * endereço, rede e tipo preserva a conexão simulada; mudar qualquer um a
   * desfaz.
   */
  route('put', '/wallets/:slot', async ({ request, params }) => {
    const { user } = authenticate(request)
    const slot = slotOrFail(params.slot)
    const body = (await readJson<SaveWalletRequest>(request)) as Partial<Record<string, unknown>>
    const fields = {
      nickname: text(body.nickname),
      displayName: text(body.displayName),
      profileName: text(body.profileName),
      email: text(body.email).toLowerCase(),
      ensName: text(body.ensName).toLowerCase(),
      referralCode: text(body.referralCode).toUpperCase(),
      network: text(body.network),
      address: text(body.address),
      secondaryAddressOrEns: text(body.secondaryAddressOrEns),
      provider: text(body.provider),
    }
    forcedValidation()
    const fieldErrors = validateWalletFields(fields)
    const { network, provider } = fields
    if (Object.keys(fieldErrors).length > 0 || !isNetwork(network) || !isProvider(provider)) {
      throw validationError(fieldErrors)
    }
    const duplicate = db.state.wallets.some(
      (entry) =>
        entry.userId === user.id &&
        entry.wallet.slot !== slot &&
        entry.wallet.address.toLowerCase() === fields.address.toLowerCase(),
    )
    if (duplicate) {
      throw validationError({ address: ['Este endereço já está cadastrado na outra carteira'] })
    }

    const previous = db.state.wallets.find((entry) => entry.userId === user.id && entry.wallet.slot === slot)
    const keepsConnection =
      previous?.wallet.connected === true &&
      previous.wallet.address.toLowerCase() === fields.address.toLowerCase() &&
      previous.wallet.network === network &&
      previous.wallet.provider === provider
    const wallet: WalletDto = {
      ...fields,
      slot,
      network,
      provider,
      secondaryAddressOrEns: fields.secondaryAddressOrEns || null,
      connected: keepsConnection,
      updatedAt: new Date().toISOString(),
    }
    db.state.wallets = [
      ...db.state.wallets.filter((entry) => !(entry.userId === user.id && entry.wallet.slot === slot)),
      { userId: user.id, wallet },
    ]
    return commitJson(wallet)
  }),

  route('delete', '/wallets/:slot', ({ request, params }) => {
    const { user } = authenticate(request)
    const slot = slotOrFail(params.slot)
    db.state.wallets = db.state.wallets.filter(
      (entry) => !(entry.userId === user.id && entry.wallet.slot === slot),
    )
    return commitEmpty()
  }),

  /**
   * Conexão simulada pelo provedor escolhido, que passa a ser o tipo da
   * carteira; o cenário `wallet-rejected` recusa na carteira.
   */
  route('post', '/wallets/:slot/connect', async ({ request, params }) => {
    const { user } = authenticate(request)
    const entry = walletOf(user.id, slotOrFail(params.slot))
    const body = await readJson<ConnectWalletRequest>(request)
    const provider = PROVIDERS.find((candidate) => candidate === body.provider)
    if (!provider) throw validationError({ provider: ['Escolha MetaMask, WalletConnect ou Coinbase'] })
    if (scenarios.is('wallet-rejected')) {
      throw new ApiError(409, 'WALLET_REJECTED', 'A conexão foi recusada na carteira')
    }
    entry.wallet = { ...entry.wallet, connected: true, provider, updatedAt: new Date().toISOString() }
    return commitJson(entry.wallet)
  }),

  route('post', '/wallets/:slot/disconnect', ({ request, params }) => {
    const { user } = authenticate(request)
    const entry = walletOf(user.id, slotOrFail(params.slot))
    entry.wallet = { ...entry.wallet, connected: false, updatedAt: new Date().toISOString() }
    return commitJson(entry.wallet)
  }),
]
