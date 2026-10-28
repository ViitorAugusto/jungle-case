import type { Profile } from '@domain/entities/profile'
import {
  isNetwork,
  isWalletProvider,
  validateWalletPaymentFields,
  type Network,
  type Wallet,
  type WalletProvider,
} from '@domain/entities/wallet'
import {
  collectFieldErrors,
  prefixFieldErrors,
  USERNAME_PATTERN,
  validateEmail,
  validateEnsName,
  validateName,
  validateReferralCode,
  validateUsername,
} from '@domain/value-objects/identity-fields'

export {
  isWalletProvider,
  walletProviderLabels,
  walletProviders,
  type WalletProvider,
} from '@domain/entities/wallet'
export {
  ENS_PATTERN,
  isEnsName,
  REFERRAL_CODE_PATTERN,
  USERNAME_PATTERN,
} from '@domain/value-objects/identity-fields'

/** Dados do colecionador no formulário de pagamento do Figma. */
export type OrderCollector = {
  readonly displayName: string
  readonly username: string
  readonly profileName: string
  readonly email: string
  /** Nome ENS do colecionador (`algo.eth`). */
  readonly ensName: string
  readonly referralCode: string
  readonly note: string | null
}

/** Carteira e rede escolhidas para pagar. */
export type OrderPayment = {
  readonly network: Network
  readonly address: string
  /** Endereço ou ENS secundário (opcional), no formato da mesma rede. */
  readonly secondaryAddressOrEns: string | null
  readonly provider: WalletProvider
  /** Carteira cadastrada usada (`primary`/`secondary`), quando houver. */
  readonly walletId: string | null
}

export const ORDER_NOTE_MAX_LENGTH = 280

/** Valores crus do formulário (o que o usuário digitou). */
export type CheckoutFormValues = {
  readonly collector: {
    readonly displayName: string
    readonly username: string
    readonly profileName: string
    readonly email: string
    readonly ensName: string
    readonly referralCode: string
    readonly note: string
  }
  readonly payment: {
    readonly network: string
    readonly address: string
    readonly secondaryAddressOrEns: string
    readonly provider: string
    readonly walletId: string | null
  }
}

/** Normaliza espaços e caixa onde a regra é insensível a ela. */
export const normalizeCheckoutForm = (values: CheckoutFormValues): CheckoutFormValues => ({
  collector: {
    displayName: values.collector.displayName.trim(),
    username: values.collector.username.trim().toLowerCase(),
    profileName: values.collector.profileName.trim(),
    email: values.collector.email.trim().toLowerCase(),
    ensName: values.collector.ensName.trim().toLowerCase(),
    referralCode: values.collector.referralCode.trim().toUpperCase(),
    note: values.collector.note.trim(),
  },
  payment: {
    network: values.payment.network,
    address: values.payment.address.trim(),
    secondaryAddressOrEns: values.payment.secondaryAddressOrEns.trim(),
    provider: values.payment.provider,
    walletId: values.payment.walletId,
  },
})

/**
 * Regras do formulário de pagamento (as mesmas do perfil e da carteira).
 * Chaves = caminho do campo (`collector.ensName`, `payment.address`...). Vazio = válido.
 */
export const validateCheckoutForm = (raw: CheckoutFormValues): Record<string, string[]> => {
  const { collector, payment } = normalizeCheckoutForm(raw)
  return {
    ...prefixFieldErrors(
      'collector',
      collectFieldErrors({
        displayName: validateName(collector.displayName),
        username: validateUsername(collector.username),
        profileName: validateName(collector.profileName),
        email: validateEmail(collector.email),
        ensName: validateEnsName(collector.ensName),
        referralCode: validateReferralCode(collector.referralCode),
        note:
          collector.note.length > ORDER_NOTE_MAX_LENGTH
            ? [`Use no máximo ${ORDER_NOTE_MAX_LENGTH} caracteres`]
            : [],
      }),
    ),
    ...prefixFieldErrors('payment', validateWalletPaymentFields(payment)),
  }
}

/** Formulário já validado em valores tipados para o pedido. */
export const toOrderParties = (
  raw: CheckoutFormValues,
): { readonly collector: OrderCollector; readonly payment: OrderPayment } | null => {
  if (Object.keys(validateCheckoutForm(raw)).length > 0) return null
  const { collector, payment } = normalizeCheckoutForm(raw)
  if (!isNetwork(payment.network) || !isWalletProvider(payment.provider)) return null
  return {
    collector: { ...collector, note: collector.note || null },
    payment: {
      network: payment.network,
      address: payment.address,
      secondaryAddressOrEns: payment.secondaryAddressOrEns || null,
      provider: payment.provider,
      walletId: payment.walletId,
    },
  }
}

export const emptyCheckoutForm = (): CheckoutFormValues => ({
  collector: {
    displayName: '',
    username: '',
    profileName: '',
    email: '',
    ensName: '',
    referralCode: '',
    note: '',
  },
  payment: { network: '', address: '', secondaryAddressOrEns: '', provider: '', walletId: null },
})

/** Nome de usuário sugerido a partir do e-mail (parte local no formato aceito). */
export const suggestUsername = (email: string) => {
  const local = (email.split('@')[0] ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '_')
    .slice(0, 20)
  return USERNAME_PATTERN.test(local) ? local : ''
}

/**
 * Pré-preenchimento do pagamento ("preenche uma vez"): dados do colecionador,
 * rede, endereço e tipo vêm da carteira principal; sem ela, nome, e-mail e ENS
 * vêm do perfil. O nome de usuário é sempre o do perfil.
 */
export const prefillCheckoutForm = (
  profile: Pick<Profile, 'displayName' | 'username' | 'email' | 'ensName'> | null,
  wallet: Wallet | null,
): CheckoutFormValues => {
  const empty = emptyCheckoutForm()
  const username = profile ? profile.username || suggestUsername(profile.email) : ''
  const collector = wallet
    ? {
        ...empty.collector,
        displayName: wallet.displayName,
        profileName: wallet.profileName,
        email: wallet.email,
        ensName: wallet.ensName,
        referralCode: wallet.referralCode,
        username,
      }
    : profile
      ? {
          ...empty.collector,
          displayName: profile.displayName,
          profileName: profile.displayName,
          email: profile.email,
          ensName: profile.ensName,
          username,
        }
      : empty.collector
  return {
    collector,
    payment: wallet
      ? {
          network: wallet.network,
          address: wallet.address,
          secondaryAddressOrEns: wallet.secondaryAddressOrEns ?? '',
          provider: wallet.provider,
          walletId: wallet.slot,
        }
      : empty.payment,
  }
}
