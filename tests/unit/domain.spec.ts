import { expect, test } from '@playwright/test'

import { diffCart, type Cart, type CartLine } from '@domain/entities/cart'
import { isConfirmed, reconcileOrder } from '@domain/entities/order'
import { diffQuotes, isQuoteOutdated, type Quote, type QuoteLine } from '@domain/entities/quote'
import { validateWalletDraft } from '@domain/entities/wallet'
import { EthAmount, InvalidEthAmountError } from '@domain/value-objects/eth-amount'
import { Quantity, QuantityExceedsAvailabilityError } from '@domain/value-objects/quantity'

import { orderFixture } from './support/fakes'

test.describe('EthAmount', () => {
  test('soma sem erro de ponto flutuante', () => {
    expect(EthAmount.of('0.1').plus(EthAmount.of('0.2')).toString()).toBe('0.3')
  })

  test('mantém 18 casas e normaliza zeros', () => {
    expect(EthAmount.of('1.000000000000000001').toString()).toBe('1.000000000000000001')
    expect(EthAmount.of('2.50').toString()).toBe('2.5')
  })

  test('multiplica por inteiro e calcula pontos-base', () => {
    expect(EthAmount.of('0.39').times(3).toString()).toBe('1.17')
    expect(EthAmount.of('1.99').percentage(1000).toString()).toBe('0.199')
  })

  test('recusa formato inválido e mais de 18 casas', () => {
    expect(() => EthAmount.of('1,5')).toThrow(InvalidEthAmountError)
    expect(() => EthAmount.of('0.0000000000000000001')).toThrow(InvalidEthAmountError)
  })
})

test.describe('Quantity', () => {
  test('aceita inteiro dentro do estoque', () => {
    expect(Quantity.within(2, 5).value).toBe(2)
  })

  test('recusa acima do estoque e não inteiro', () => {
    expect(() => Quantity.within(3, 2)).toThrow(QuantityExceedsAvailabilityError)
    expect(() => Quantity.of(1.5)).toThrow()
    expect(() => Quantity.of(0)).toThrow()
  })
})

test.describe('reconcileOrder', () => {
  test('versão maior substitui; igual ou menor é ignorada', () => {
    const current = orderFixture({ version: 2 })
    expect(reconcileOrder(current, orderFixture({ version: 3, status: 'confirmed' })).version).toBe(3)
    expect(reconcileOrder(current, orderFixture({ version: 2, status: 'rejected' }))).toBe(current)
    expect(reconcileOrder(current, orderFixture({ version: 1 }))).toBe(current)
  })

  test('estado final nunca muda', () => {
    const confirmed = orderFixture({ version: 2, status: 'confirmed' })
    expect(reconcileOrder(confirmed, orderFixture({ version: 9, status: 'rejected' }))).toBe(confirmed)
  })

  test('confirmação exige status confirmado com transação', () => {
    expect(isConfirmed(orderFixture({ status: 'pending' }))).toBe(false)
    expect(isConfirmed(orderFixture({ status: 'confirmed', transaction: null }))).toBe(false)
    expect(
      isConfirmed(orderFixture({ status: 'confirmed', transaction: { hash: '0x1', explorerUrl: 'x' } })),
    ).toBe(true)
  })
})

const quoteLine = (overrides: Partial<QuoteLine> = {}): QuoteLine => ({
  nftId: 'nft-001',
  editionId: 'nft-001-std',
  tokenId: '#0042',
  nftName: 'Emerald Ape #042',
  editionName: 'Padrão',
  editionSupply: 50,
  imageUrl: '/a.svg',
  unitPriceEth: '1.19',
  quantity: 1,
  available: 5,
  lineTotalEth: '1.19',
  ...overrides,
})

const quote = (lines: QuoteLine[], overrides: Partial<Quote> = {}): Quote => ({
  id: 'qte_1',
  lines,
  coupon: null,
  summary: { subtotalEth: '1.19', discountEth: '0', networkFeeEth: '0.016', totalEth: '1.206' },
  createdAt: '2026-10-27T12:00:00.000Z',
  expiresAt: '2026-10-27T12:10:00.000Z',
  ...overrides,
})

const cartFrom = (lines: Partial<CartLine>[]): Cart => ({
  owner: 'user',
  lines: lines.map((line) => ({
    id: `${line.nftId ?? 'nft-001'}:${line.editionId ?? 'nft-001-std'}`,
    ...quoteLine(),
    ...line,
  })),
  coupon: null,
  summary: { subtotalEth: '0', discountEth: '0', networkFeeEth: '0', totalEth: '0' },
  itemCount: lines.length,
  version: 1,
})

test.describe('diffQuotes / isQuoteOutdated', () => {
  test('detecta mudança de preço e de total', () => {
    const before = quote([quoteLine()])
    const after = quote([quoteLine({ unitPriceEth: '1.309' })], {
      summary: { ...before.summary, totalEth: '1.3109' },
    })
    expect(diffQuotes(before, after).map((change) => change.kind)).toEqual(['price', 'total'])
  })

  test('sem diferenças não exige nova confirmação', () => {
    expect(diffQuotes(quote([quoteLine()]), quote([quoteLine()], { id: 'qte_2' }))).toEqual([])
  })

  test('cotação fica desatualizada quando o carrinho muda preço ou estoque', () => {
    const reviewed = quote([quoteLine()])
    expect(isQuoteOutdated(reviewed, cartFrom([{}]))).toBe(false)
    expect(isQuoteOutdated(reviewed, cartFrom([{ unitPriceEth: '1.5' }]))).toBe(true)
    expect(isQuoteOutdated(reviewed, cartFrom([{ available: 0 }]))).toBe(true)
  })
})

test.describe('diffCart', () => {
  test('lista preço alterado, estoque alterado e linha removida', () => {
    const before = cartFrom([{}, { nftId: 'nft-002', editionId: 'nft-002-std', nftName: 'Sage Nomad #009' }])
    const after = cartFrom([{ unitPriceEth: '1.29', available: 2 }])
    expect(diffCart(before, after).map((change) => change.kind)).toEqual(['price', 'availability', 'removed'])
  })
})

test.describe('validateWalletDraft', () => {
  const draft = {
    nickname: 'Principal',
    displayName: 'Alex Rocha',
    profileName: 'Alex Rocha',
    email: 'Alex@Jungle.test',
    ensName: 'AlexRocha.eth',
    referralCode: 'jng-2026',
    network: 'polygon',
    address: '0x' + 'a'.repeat(40),
    secondaryAddressOrEns: '',
    provider: 'coinbase',
  }

  test('valida endereço conforme a rede, normaliza e estreita os tipos', () => {
    const result = validateWalletDraft(draft)
    expect(result.valid && result.draft).toMatchObject({
      network: 'polygon',
      provider: 'coinbase',
      email: 'alex@jungle.test',
      ensName: 'alexrocha.eth',
      referralCode: 'JNG-2026',
      secondaryAddressOrEns: null,
    })
    expect(validateWalletDraft({ ...draft, network: 'solana' }).valid).toBe(false)
  })

  test('erros por campo com os nomes do formulário', () => {
    const result = validateWalletDraft({
      ...draft,
      nickname: 'X',
      ensName: 'alex',
      network: 'bitcoin',
      provider: 'phantom',
    })
    expect(result.valid ? [] : Object.keys(result.fieldErrors).sort()).toEqual([
      'ensName',
      'network',
      'nickname',
      'provider',
    ])
  })
})
