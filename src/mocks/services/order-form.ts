import type { CollectorDto, CreateOrderRequest, PaymentDto, WalletDto } from '@adapters/http/contracts'

import {
  isNetwork,
  isProvider,
  prefixErrors,
  text,
  validateCollectorFields,
  validatePaymentFields,
} from '@mocks/services/validation'

const NOTE_MAX = 280

export type ValidatedOrderForm =
  | { readonly ok: true; readonly collector: CollectorDto; readonly payment: PaymentDto }
  | { readonly ok: false; readonly fieldErrors: Record<string, string[]> }

/**
 * Valida o corpo de `POST /orders` campo a campo (422 com `fieldErrors` nas
 * chaves `collector.*` e `payment.*`). Com `walletId`, a carteira cadastrada
 * precisa existir, estar conectada pelo mesmo provedor e ter o mesmo endereço
 * e rede; sem ela (carteira manual), basta provedor válido e endereço da rede.
 */
export const validateOrderForm = (
  body: Partial<CreateOrderRequest>,
  findWallet: (walletId: string) => WalletDto | undefined,
): ValidatedOrderForm => {
  const raw = (body.collector ?? {}) as Partial<Record<keyof CollectorDto, unknown>>
  const pay = (body.payment ?? {}) as Partial<Record<keyof PaymentDto, unknown>>
  const collector: CollectorDto = {
    displayName: text(raw.displayName),
    username: text(raw.username).toLowerCase(),
    profileName: text(raw.profileName),
    email: text(raw.email).toLowerCase(),
    ensName: text(raw.ensName).toLowerCase(),
    referralCode: text(raw.referralCode).toUpperCase(),
    note: text(raw.note) || null,
  }
  const payment = {
    network: text(pay.network),
    address: text(pay.address),
    secondaryAddressOrEns: text(pay.secondaryAddressOrEns),
    provider: text(pay.provider),
  }
  const walletId = text(pay.walletId) || null

  const errors: Record<string, string[]> = {
    ...prefixErrors('collector', validateCollectorFields(collector)),
    ...prefixErrors('payment', validatePaymentFields(payment)),
  }
  if ((collector.note ?? '').length > NOTE_MAX)
    errors['collector.note'] = [`Use no máximo ${NOTE_MAX} caracteres`]

  const wallet = walletId === null ? undefined : findWallet(walletId)
  if (walletId !== null && !wallet) errors['payment.walletId'] = ['Carteira não cadastrada']
  if (wallet && !errors['payment.provider'] && !(wallet.connected && wallet.provider === payment.provider)) {
    errors['payment.provider'] = ['Conecte a carteira pelo provedor escolhido']
  }
  if (wallet && !errors['payment.network'] && !errors['payment.address']) {
    const same =
      wallet.address.toLowerCase() === payment.address.toLowerCase() && wallet.network === payment.network
    if (!same) errors['payment.address'] = ['Endereço e rede diferentes da carteira selecionada']
  }

  const { network, provider } = payment
  if (Object.keys(errors).length > 0 || !isNetwork(network) || !isProvider(provider)) {
    return { ok: false, fieldErrors: errors }
  }
  return {
    ok: true,
    collector,
    payment: {
      network,
      address: payment.address,
      secondaryAddressOrEns: payment.secondaryAddressOrEns || null,
      provider,
      walletId,
    },
  }
}
