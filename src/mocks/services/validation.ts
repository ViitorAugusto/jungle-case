import type { NetworkDto, WalletProviderDto } from '@adapters/http/contracts'

/**
 * Validações do servidor simulado (espelham as regras do cliente, mas são
 * independentes). Perfil, carteira e pedido usam as mesmas regras de campo.
 */
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const EVM_ADDRESS = /^0x[0-9a-fA-F]{40}$/
const SOLANA_ADDRESS = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/
const USERNAME = /^[a-z0-9_]{3,20}$/
const ENS = /^(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)*[a-z0-9][a-z0-9-]{1,61}[a-z0-9]\.eth$/
/** Código de indicação: 3 letras maiúsculas, hífen e 4 dígitos (ex.: `JNG-2026`). */
const REFERRAL = /^[A-Z]{3}-\d{4}$/
export const NETWORKS = ['ethereum', 'polygon', 'solana'] as const
export const PROVIDERS = ['metamask', 'walletconnect', 'coinbase'] as const

type Errors = Record<string, string[]>

export const isEmail = (value: string) => EMAIL.test(value)
export const isEns = (value: string) => ENS.test(value)
export const isNetwork = (value: string): value is NetworkDto =>
  (NETWORKS as readonly string[]).includes(value)
export const isProvider = (value: string): value is WalletProviderDto =>
  (PROVIDERS as readonly string[]).includes(value)

/** Endereço no formato da rede: 0x + 40 hex (Ethereum/Polygon) ou base58 (Solana). */
export const isWalletAddressFor = (address: string, network: NetworkDto) =>
  (network === 'solana' ? SOLANA_ADDRESS : EVM_ADDRESS).test(address)

/** Texto do corpo JSON já sem espaços nas pontas (`''` para ausente ou não texto). */
export const text = (value: unknown) => (typeof value === 'string' ? value.trim() : '')

const collect = (entries: Record<string, string | null>): Errors =>
  Object.fromEntries(
    Object.entries(entries).flatMap(([field, message]) => (message ? [[field, [message]]] : [])),
  )

const nameError = (value: string) =>
  value.length >= 2 && value.length <= 60 ? null : 'Informe um nome entre 2 e 60 caracteres'
const emailError = (value: string) => (EMAIL.test(value) ? null : 'Informe um e-mail válido')
const usernameError = (value: string) =>
  USERNAME.test(value) ? null : 'Use de 3 a 20 letras minúsculas, números ou _'
const ensError = (value: string) => (ENS.test(value) ? null : 'Informe um nome ENS terminado em .eth')
const referralError = (value: string) =>
  REFERRAL.test(value) ? null : 'Use 3 letras, hífen e 4 dígitos (ex.: JNG-2026)'
const nicknameError = (value: string) =>
  value.length >= 2 && value.length <= 40 ? null : 'Informe um apelido entre 2 e 40 caracteres'

const passwordErrors = (password: string) => {
  const errors: string[] = []
  if (password.length < 8) errors.push('Use pelo menos 8 caracteres')
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) errors.push('Combine letras e números')
  return errors
}

export const validateNewPassword = (password: string) => passwordErrors(password)

/** Cadastro: nome, e-mail e senha. */
export const validateRegistrationFields = (fields: { name: string; email: string; password: string }) => {
  const errors = collect({ name: nameError(fields.name), email: emailError(fields.email) })
  const password = passwordErrors(fields.password)
  return password.length > 0 ? { ...errors, password } : errors
}

/** "Perfil do colecionador"; espera valores já normalizados. */
export const validateProfileFields = (fields: {
  displayName: string
  username: string
  email: string
  ensName: string
  walletNickname: string
}): Errors =>
  collect({
    displayName: nameError(fields.displayName),
    username: usernameError(fields.username),
    email: emailError(fields.email),
    ensName: ensError(fields.ensName),
    walletNickname: nicknameError(fields.walletNickname),
  })

/** Dados do colecionador no pagamento e na carteira; espera valores já normalizados. */
export const validateCollectorFields = (fields: {
  displayName: string
  profileName: string
  email: string
  ensName: string
  referralCode: string
  username?: string
}): Errors =>
  collect({
    displayName: nameError(fields.displayName),
    ...(fields.username === undefined ? {} : { username: usernameError(fields.username) }),
    profileName: nameError(fields.profileName),
    email: emailError(fields.email),
    ensName: ensError(fields.ensName),
    referralCode: referralError(fields.referralCode),
  })

/** Rede, endereço, ENS/carteira secundária e tipo (provedor). */
export const validatePaymentFields = (fields: {
  network: string
  address: string
  secondaryAddressOrEns: string
  provider: string
}): Errors => {
  const { network, address, secondaryAddressOrEns: secondary } = fields
  const provider = isProvider(fields.provider) ? null : 'Escolha MetaMask, WalletConnect ou Coinbase'
  if (!isNetwork(network)) return collect({ network: 'Selecione uma rede suportada', provider })
  return collect({
    address: isWalletAddressFor(address, network) ? null : 'Endereço inválido para a rede selecionada',
    secondaryAddressOrEns:
      !secondary || isWalletAddressFor(secondary, network) || ENS.test(secondary.toLowerCase())
        ? null
        : 'Informe um endereço da rede selecionada ou um nome .eth',
    provider,
  })
}

/** Cadastro de carteira: apelido + colecionador + pagamento. */
export const validateWalletFields = (fields: {
  nickname: string
  displayName: string
  profileName: string
  email: string
  ensName: string
  referralCode: string
  network: string
  address: string
  secondaryAddressOrEns: string
  provider: string
}): Errors => ({
  ...collect({ nickname: nicknameError(fields.nickname) }),
  ...validateCollectorFields(fields),
  ...validatePaymentFields(fields),
})

/** `ensName` → `collector.ensName` para o corpo aninhado do pedido. */
export const prefixErrors = (prefix: string, errors: Errors): Errors =>
  Object.fromEntries(Object.entries(errors).map(([field, messages]) => [`${prefix}.${field}`, messages]))
