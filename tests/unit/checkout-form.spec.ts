import { expect, test } from '@playwright/test'

import type { CreateOrderRequest, WalletDto } from '@adapters/http/contracts'

import { prefillCheckoutForm, suggestUsername } from '@domain/entities/checkout-form'
import { receiptWalletLabel } from '@domain/entities/receipt'

import { validateOrderForm } from '@mocks/services/order-form'

const ADDRESS = '0x1111111111111111111111111111111111111111'

const wallet = (overrides: Partial<WalletDto> = {}): WalletDto => ({
  slot: 'primary',
  nickname: 'Cofre do Alex',
  displayName: 'Alex Rocha',
  profileName: 'Alex R.',
  email: 'alex@jungle.test',
  ensName: 'alexrocha.eth',
  referralCode: 'JNG-2026',
  address: ADDRESS,
  network: 'ethereum',
  secondaryAddressOrEns: null,
  connected: true,
  provider: 'metamask',
  updatedAt: '2026-10-27T12:00:00.000Z',
  ...overrides,
})

const body: CreateOrderRequest = {
  quoteId: 'qte_1',
  collector: {
    displayName: 'Alex Rocha',
    username: 'alex',
    profileName: 'Alex Rocha',
    email: 'alex@teste.dev',
    ensName: 'alexrocha.eth',
    referralCode: 'JNG-2026',
    note: null,
  },
  payment: {
    network: 'ethereum',
    address: ADDRESS,
    secondaryAddressOrEns: null,
    provider: 'metamask',
    walletId: 'primary',
  },
}

const fieldsOf = (result: ReturnType<typeof validateOrderForm>) =>
  result.ok ? [] : Object.keys(result.fieldErrors).sort()

test.describe('validateOrderForm (POST /orders no MSW)', () => {
  test('aceita o formulário completo com carteira conectada pelo mesmo provedor', () => {
    expect(validateOrderForm(body, () => wallet()).ok).toBe(true)
  })

  test('devolve erro por campo do colecionador e do pagamento', () => {
    const result = validateOrderForm(
      {
        ...body,
        collector: { ...body.collector, username: 'A', ensName: 'alex.com', referralCode: 'jng2026' },
        payment: { ...body.payment, address: 'xyz', secondaryAddressOrEns: 'nao-e-ens' },
      },
      () => wallet(),
    )
    expect(fieldsOf(result)).toEqual([
      'collector.ensName',
      'collector.referralCode',
      'collector.username',
      'payment.address',
      'payment.secondaryAddressOrEns',
    ])
  })

  test('carteira cadastrada precisa estar conectada pelo provedor escolhido', () => {
    expect(fieldsOf(validateOrderForm(body, () => wallet({ connected: false })))).toEqual([
      'payment.provider',
    ])
    expect(fieldsOf(validateOrderForm(body, () => wallet({ provider: 'coinbase' })))).toEqual([
      'payment.provider',
    ])
  })

  test('endereço diferente da carteira cadastrada é recusado; carteira inexistente também', () => {
    const other = '0x2222222222222222222222222222222222222222'
    expect(
      fieldsOf(validateOrderForm({ ...body, payment: { ...body.payment, address: other } }, () => wallet())),
    ).toEqual(['payment.address'])
    expect(fieldsOf(validateOrderForm(body, () => undefined))).toEqual(['payment.walletId'])
  })

  test('carteira manual (sem walletId) dispensa conexão e aceita ENS secundário', () => {
    const manual = {
      ...body,
      payment: {
        ...body.payment,
        network: 'solana',
        address: '7EcDhSYGxXyscszYEp35KHN8vvw3svAuLKTzXwCFLtV',
        secondaryAddressOrEns: 'cofre.alexrocha.eth',
        provider: 'walletconnect',
        walletId: null,
      },
    } satisfies CreateOrderRequest
    const result = validateOrderForm(manual, () => undefined)
    expect(result.ok).toBe(true)
  })
})

test.describe('pré-preenchimento do pagamento', () => {
  const profile = {
    displayName: 'Alex Rocha',
    username: 'alex_rocha',
    email: 'alex@jungle.test',
    ensName: 'perfil.eth',
  }

  test('colecionador, rede, endereço e tipo vêm da carteira principal; usuário do perfil', () => {
    const values = prefillCheckoutForm(profile, wallet())
    expect(values.collector).toEqual({
      displayName: 'Alex Rocha',
      username: 'alex_rocha',
      profileName: 'Alex R.',
      email: 'alex@jungle.test',
      ensName: 'alexrocha.eth',
      referralCode: 'JNG-2026',
      note: '',
    })
    expect(values.payment).toEqual({
      network: 'ethereum',
      address: ADDRESS,
      secondaryAddressOrEns: '',
      provider: 'metamask',
      walletId: 'primary',
    })
  })

  test('sem carteira principal usa nome, e-mail e ENS do perfil', () => {
    const values = prefillCheckoutForm(profile, null)
    expect(values.collector).toMatchObject({
      displayName: 'Alex Rocha',
      ensName: 'perfil.eth',
      referralCode: '',
    })
    expect(values.payment.walletId).toBeNull()
  })

  test('nome de usuário só é sugerido quando cabe no formato', () => {
    expect(suggestUsername('ab@teste.dev')).toBe('')
    expect(suggestUsername('bia.souza@teste.dev')).toBe('bia_souza')
  })
})

test('"Carteira" do recibo é o provedor do pagamento', () => {
  expect(receiptWalletLabel({ payment: { ...body.payment, provider: 'coinbase' } })).toBe('Coinbase Wallet')
})
