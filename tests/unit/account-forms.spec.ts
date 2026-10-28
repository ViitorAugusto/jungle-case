import { expect, test } from '@playwright/test'

import { validateProfileDraft } from '@domain/entities/profile'
import {
  copyPrimaryWalletProfile,
  emptyWalletDraft,
  toWalletDraft,
  type Wallet,
} from '@domain/entities/wallet'

import { validateProfileFields, validateWalletFields } from '@mocks/services/validation'

const profileDraft = {
  displayName: 'Alex Rocha',
  username: 'alex_rocha',
  email: 'alex@jungle.test',
  ensName: 'alexrocha.eth',
  walletNickname: 'Cofre do Alex',
}

const primary: Wallet = {
  slot: 'primary',
  nickname: 'Cofre do Alex',
  displayName: 'Alex Rocha',
  profileName: 'Alex R.',
  email: 'alex@jungle.test',
  ensName: 'alexrocha.eth',
  referralCode: 'JNG-2026',
  network: 'ethereum',
  address: '0x1111111111111111111111111111111111111111',
  secondaryAddressOrEns: null,
  provider: 'metamask',
  connected: true,
  updatedAt: '2026-10-27T12:00:00.000Z',
}

test.describe('perfil do colecionador', () => {
  test('cliente e MSW aceitam o mesmo perfil válido', () => {
    expect(validateProfileDraft(profileDraft)).toEqual({})
    expect(validateProfileFields(profileDraft)).toEqual({})
  })

  test('cliente e MSW recusam os mesmos campos', () => {
    const invalid = {
      displayName: 'A',
      username: 'Alex Rocha',
      email: 'x',
      ensName: 'alex',
      walletNickname: '',
    }
    const keys = Object.keys(validateProfileDraft(invalid)).sort()
    expect(keys).toEqual(['displayName', 'email', 'ensName', 'username', 'walletNickname'])
    expect(Object.keys(validateProfileFields(invalid)).sort()).toEqual(keys)
  })

  test('caixa e espaços são normalizados antes de validar', () => {
    expect(
      validateProfileDraft({ ...profileDraft, username: ' Alex_Rocha ', ensName: 'AlexRocha.ETH' }),
    ).toEqual({})
  })
})

test.describe('carteira', () => {
  test('MSW recusa os mesmos campos que o cliente, com as mesmas chaves', () => {
    const fields = {
      ...toWalletDraft(primary),
      nickname: 'X',
      referralCode: 'JNG2026',
      address: '0x123',
      secondaryAddressOrEns: 'nao-e-ens',
    }
    expect(Object.keys(validateWalletFields(fields)).sort()).toEqual([
      'address',
      'nickname',
      'referralCode',
      'secondaryAddressOrEns',
    ])
  })

  test('carteira salva volta ao formulário sem perder campos', () => {
    expect(validateWalletFields(toWalletDraft(primary))).toEqual({})
  })

  test('"Igual à carteira principal" copia o colecionador e o tipo, mas não apelido, rede e endereço', () => {
    const secondary = {
      ...emptyWalletDraft(),
      nickname: 'Reserva',
      network: 'solana',
      address: '7EcDhSYGxXyscszYEp35KHN8vvw3svAuLKTzXwCFLtV',
    }
    expect(copyPrimaryWalletProfile(secondary, primary)).toEqual({
      ...secondary,
      displayName: 'Alex Rocha',
      profileName: 'Alex R.',
      email: 'alex@jungle.test',
      ensName: 'alexrocha.eth',
      referralCode: 'JNG-2026',
      provider: 'metamask',
    })
  })
})
