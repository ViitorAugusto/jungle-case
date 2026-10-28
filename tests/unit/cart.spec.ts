import { expect, test } from '@playwright/test'

import { AddCartItemUseCase } from '@application/use-cases/cart/add-cart-item.use-case'
import { MergeGuestCartUseCase } from '@application/use-cases/cart/merge-guest-cart.use-case'
import { UpdateCartItemUseCase } from '@application/use-cases/cart/update-cart-item.use-case'

import { MemoryGuestCart, RecordingCartGateway } from './support/fakes'

test.describe('MergeGuestCartUseCase', () => {
  test('leva o carrinho do visitante para o usuário e esquece o id do visitante', async () => {
    const cart = new RecordingCartGateway()
    const guestCart = new MemoryGuestCart('guest-abc')

    const merged = await new MergeGuestCartUseCase(cart, guestCart).execute()

    expect(merged).toBe(true)
    expect(cart.merged).toEqual(['guest-abc'])
    expect(guestCart.load()).toBeNull()
  })

  test('sem carrinho de visitante não chama a API', async () => {
    const cart = new RecordingCartGateway()

    const merged = await new MergeGuestCartUseCase(cart, new MemoryGuestCart()).execute()

    expect(merged).toBe(false)
    expect(cart.merged).toEqual([])
  })

  test('falha na mescla não derruba o login e guarda o id para nova tentativa', async () => {
    const cart = new RecordingCartGateway()
    cart.failMerge = new Error('rede')
    const guestCart = new MemoryGuestCart('guest-abc')
    const useCase = new MergeGuestCartUseCase(cart, guestCart)

    expect(await useCase.execute()).toBe(false)
    expect(guestCart.load()).toBe('guest-abc')

    cart.failMerge = null
    expect(await useCase.execute()).toBe(true)
    expect(cart.merged).toEqual(['guest-abc', 'guest-abc'])
    expect(guestCart.load()).toBeNull()
  })
})

test.describe('AddCartItemUseCase', () => {
  const item = { nftId: 'nft-002', editionId: 'nft-002-std' }

  test('envia a quantidade dentro do estoque da edição', async () => {
    const cart = new RecordingCartGateway()

    await new AddCartItemUseCase(cart).execute({ ...item, quantity: 3, available: 3 })

    expect(cart.added).toEqual([{ ...item, quantity: 3 }])
  })

  test('acima do estoque é barrado antes da rede com o motivo do domínio', async () => {
    const cart = new RecordingCartGateway()

    await expect(
      new AddCartItemUseCase(cart).execute({ ...item, quantity: 4, available: 3 }),
    ).rejects.toMatchObject({ code: 'VALIDATION', reason: 'QUANTITY_EXCEEDS_AVAILABILITY' })
    expect(cart.added).toEqual([])
  })

  test('edição esgotada é barrada', async () => {
    const cart = new RecordingCartGateway()

    await expect(
      new AddCartItemUseCase(cart).execute({ ...item, quantity: 1, available: 0 }),
    ).rejects.toMatchObject({ code: 'VALIDATION', message: 'Esta edição está esgotada' })
    expect(cart.added).toEqual([])
  })

  for (const quantity of [0, -1, 1.5, Number.NaN]) {
    test(`quantidade não inteira ou não positiva (${quantity}) é barrada`, async () => {
      const cart = new RecordingCartGateway()

      await expect(new AddCartItemUseCase(cart).execute({ ...item, quantity })).rejects.toMatchObject({
        code: 'VALIDATION',
        reason: 'INVALID_QUANTITY',
      })
      expect(cart.added).toEqual([])
    })
  }

  test('sem estoque conhecido valida só o formato e deixa a API conferir a disponibilidade', async () => {
    const cart = new RecordingCartGateway()

    await new AddCartItemUseCase(cart).execute({ ...item, quantity: 50 })

    expect(cart.added).toEqual([{ ...item, quantity: 50 }])
  })
})

test.describe('UpdateCartItemUseCase', () => {
  test('atualiza a linha dentro do estoque', async () => {
    const cart = new RecordingCartGateway()

    await new UpdateCartItemUseCase(cart).execute({ lineId: 'line-1', quantity: 2, available: 5 })

    expect(cart.updated).toEqual([{ lineId: 'line-1', quantity: 2 }])
  })

  test('acima do estoque é barrado antes da rede', async () => {
    const cart = new RecordingCartGateway()

    await expect(
      new UpdateCartItemUseCase(cart).execute({ lineId: 'line-1', quantity: 6, available: 5 }),
    ).rejects.toMatchObject({ code: 'VALIDATION', reason: 'QUANTITY_EXCEEDS_AVAILABILITY' })
    expect(cart.updated).toEqual([])
  })

  test('quantidade zero é barrada (remover é outra operação)', async () => {
    const cart = new RecordingCartGateway()

    await expect(
      new UpdateCartItemUseCase(cart).execute({ lineId: 'line-1', quantity: 0, available: 5 }),
    ).rejects.toMatchObject({ code: 'VALIDATION', reason: 'INVALID_QUANTITY' })
    expect(cart.updated).toEqual([])
  })
})
