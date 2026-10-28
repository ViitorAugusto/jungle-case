import { nftNetworks, type NftNetwork } from '@domain/entities/nft'
import {
  collectFieldErrors,
  isEnsName,
  validateEmail,
  validateEnsName,
  validateName,
  validateNickname,
  validateReferralCode,
} from '@domain/value-objects/identity-fields'

/** Redes de pagamento: as mesmas em que os NFTs do catálogo são cunhados. */
export const networks = nftNetworks
export type Network = NftNetwork

export const walletSlots = ['primary', 'secondary'] as const
export type WalletSlot = (typeof walletSlots)[number]

/** Provedores de carteira ("Tipo de carteira"), com conexão simulada. */
export const walletProviders = ['metamask', 'walletconnect', 'coinbase'] as const
export type WalletProvider = (typeof walletProviders)[number]

export const walletProviderLabels: Record<WalletProvider, string> = {
  metamask: 'MetaMask',
  walletconnect: 'WalletConnect',
  coinbase: 'Coinbase Wallet',
}

/**
 * Carteira cadastrada: o mesmo formulário do pagamento (dados do colecionador,
 * rede, endereço e tipo), reaproveitado no pré-preenchimento do checkout.
 */
export type Wallet = {
  readonly slot: WalletSlot
  /** "Apelido da carteira". */
  readonly nickname: string
  readonly displayName: string
  readonly profileName: string
  readonly email: string
  readonly ensName: string
  readonly referralCode: string
  readonly network: Network
  readonly address: string
  /** Endereço ou ENS secundário (opcional), no formato da mesma rede. */
  readonly secondaryAddressOrEns: string | null
  /** "Tipo de carteira": provedor usado na conexão simulada. */
  readonly provider: WalletProvider
  /** Conexão simulada ativa pelo `provider` (aprovada pelo servidor simulado). */
  readonly connected: boolean
  readonly updatedAt: string
}

const EVM_ADDRESS = /^0x[0-9a-fA-F]{40}$/
const SOLANA_ADDRESS = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/

export const isNetwork = (value: string): value is Network => (networks as readonly string[]).includes(value)
export const isWalletSlot = (value: string): value is WalletSlot =>
  (walletSlots as readonly string[]).includes(value)
export const isWalletProvider = (value: string): value is WalletProvider =>
  (walletProviders as readonly string[]).includes(value)

/** Endereço no formato da rede: 0x + 40 hex (Ethereum/Polygon) ou base58 (Solana). */
export const isWalletAddress = (address: string, network: Network) =>
  (network === 'solana' ? SOLANA_ADDRESS : EVM_ADDRESS).test(address.trim())

/** Valores crus de rede, endereço e tipo (pagamento e cadastro de carteira). */
export type WalletPaymentFields = {
  readonly network: string
  readonly address: string
  readonly secondaryAddressOrEns: string
  readonly provider: string
}

/** Regras de rede, endereço, ENS/carteira secundária e tipo; chaves = nomes dos campos. */
export const validateWalletPaymentFields = (fields: WalletPaymentFields): Record<string, string[]> => {
  const network = fields.network
  const secondary = fields.secondaryAddressOrEns.trim()
  const provider = isWalletProvider(fields.provider) ? [] : ['Escolha MetaMask, WalletConnect ou Coinbase']
  if (!isNetwork(network)) return collectFieldErrors({ network: ['Selecione uma rede suportada'], provider })
  return collectFieldErrors({
    address: isWalletAddress(fields.address, network)
      ? []
      : [
          network === 'solana'
            ? 'Endereço Solana inválido (base58, 32 a 44 caracteres)'
            : 'Endereço inválido: use 0x seguido de 40 caracteres hexadecimais',
        ],
    secondaryAddressOrEns:
      !secondary || isWalletAddress(secondary, network) || isEnsName(secondary.toLowerCase())
        ? []
        : ['Informe um endereço da rede selecionada ou um nome .eth'],
    provider,
  })
}

/** Formulário de carteira como digitado. */
export type WalletDraft = WalletPaymentFields & {
  readonly nickname: string
  readonly displayName: string
  readonly profileName: string
  readonly email: string
  readonly ensName: string
  readonly referralCode: string
}

/** Carteira validada e normalizada, pronta para salvar. */
export type ValidWalletDraft = Omit<Wallet, 'slot' | 'connected' | 'updatedAt'>

export type WalletDraftValidation =
  | { readonly valid: true; readonly draft: ValidWalletDraft }
  | { readonly valid: false; readonly fieldErrors: Record<string, string[]> }

/** Regras de cadastro de carteira. Quando válido, devolve o rascunho normalizado e tipado. */
export const validateWalletDraft = (raw: WalletDraft): WalletDraftValidation => {
  const draft = {
    nickname: raw.nickname.trim(),
    displayName: raw.displayName.trim(),
    profileName: raw.profileName.trim(),
    email: raw.email.trim().toLowerCase(),
    ensName: raw.ensName.trim().toLowerCase(),
    referralCode: raw.referralCode.trim().toUpperCase(),
    network: raw.network,
    address: raw.address.trim(),
    secondaryAddressOrEns: raw.secondaryAddressOrEns.trim(),
    provider: raw.provider,
  }
  const errors = collectFieldErrors({
    nickname: validateNickname(draft.nickname),
    displayName: validateName(draft.displayName),
    profileName: validateName(draft.profileName),
    email: validateEmail(draft.email),
    ensName: validateEnsName(draft.ensName),
    referralCode: validateReferralCode(draft.referralCode),
    ...validateWalletPaymentFields(draft),
  })
  if (Object.keys(errors).length > 0 || !isNetwork(draft.network) || !isWalletProvider(draft.provider)) {
    return { valid: false, fieldErrors: errors }
  }
  return {
    valid: true,
    draft: {
      ...draft,
      network: draft.network,
      provider: draft.provider,
      secondaryAddressOrEns: draft.secondaryAddressOrEns || null,
    },
  }
}

/** Mesma regra em formato de erros por campo (vazio = válido), para formulários. */
export const walletDraftErrors = (draft: WalletDraft): Record<string, string[]> => {
  const result = validateWalletDraft(draft)
  return result.valid ? {} : result.fieldErrors
}

export const emptyWalletDraft = (): WalletDraft => ({
  nickname: '',
  displayName: '',
  profileName: '',
  email: '',
  ensName: '',
  referralCode: '',
  network: '',
  address: '',
  secondaryAddressOrEns: '',
  provider: '',
})

/** Carteira salva de volta em formulário (edição). */
export const toWalletDraft = (wallet: Wallet): WalletDraft => ({
  nickname: wallet.nickname,
  displayName: wallet.displayName,
  profileName: wallet.profileName,
  email: wallet.email,
  ensName: wallet.ensName,
  referralCode: wallet.referralCode,
  network: wallet.network,
  address: wallet.address,
  secondaryAddressOrEns: wallet.secondaryAddressOrEns ?? '',
  provider: wallet.provider,
})

/**
 * "Igual à carteira principal": copia os dados do colecionador e o tipo da
 * principal para o formulário da secundária; apelido, rede e endereço
 * continuam os da secundária (o mesmo endereço não pode estar nas duas).
 */
export const copyPrimaryWalletProfile = (secondary: WalletDraft, primary: Wallet): WalletDraft => ({
  ...secondary,
  displayName: primary.displayName,
  profileName: primary.profileName,
  email: primary.email,
  ensName: primary.ensName,
  referralCode: primary.referralCode,
  provider: primary.provider,
})
