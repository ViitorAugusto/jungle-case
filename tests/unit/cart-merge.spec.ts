import { expect, test } from '@playwright/test'

import { mergeGuestIntoUserCart, type MergeableCart } from '@mocks/services/cart-merge'

/** Regra do servidor simulado para a mescla do carrinho do visitante no login (R19). */

const STOCK: Record<string, number> = {
  'nft-002/nft-002-std': 6,
  'nft-001/nft-001-std': 3,
  'nft-001/nft-001-rare': 0,
}
const availableOf = (nftId: string, editionId: string) => STOCK[`${nftId}/${editionId}`]

const cart = (lines: [string, string, number][], couponCode: string | null = null): MergeableCart => ({
  lines: lines.map(([nftId, editionId, quantity]) => ({ nftId, editionId, quantity })),
  couponCode,
})

test.describe('mergeGuestIntoUserCart', () => {
  test('mesma edição nos dois soma as quantidades', () => {
    const merged = mergeGuestIntoUserCart(
      cart([['nft-002', 'nft-002-std', 2]]),
      cart([['nft-002', 'nft-002-std', 3]]),
      availableOf,
    )

    expect(merged.lines).toEqual([{ nftId: 'nft-002', editionId: 'nft-002-std', quantity: 5 }])
  })

  test('soma nunca passa do estoque da edição', () => {
    const merged = mergeGuestIntoUserCart(
      cart([['nft-002', 'nft-002-std', 4]]),
      cart([['nft-002', 'nft-002-std', 4]]),
      availableOf,
    )

    expect(merged.lines[0]?.quantity).toBe(6)
  })

  test('edição só do visitante entra limitada ao estoque', () => {
    const merged = mergeGuestIntoUserCart(cart([]), cart([['nft-001', 'nft-001-std', 10]]), availableOf)

    expect(merged.lines).toEqual([{ nftId: 'nft-001', editionId: 'nft-001-std', quantity: 3 }])
  })

  test('edição esgotada ou inexistente do visitante é ignorada', () => {
    const merged = mergeGuestIntoUserCart(
      cart([]),
      cart([
        ['nft-001', 'nft-001-rare', 1],
        ['nft-999', 'nft-999-std', 1],
      ]),
      availableOf,
    )

    expect(merged.lines).toEqual([])
  })

  test('linhas só do usuário ficam como estão e a ordem é preservada', () => {
    const merged = mergeGuestIntoUserCart(
      cart([
        ['nft-001', 'nft-001-std', 1],
        ['nft-002', 'nft-002-std', 1],
      ]),
      cart([['nft-002', 'nft-002-std', 1]]),
      availableOf,
    )

    expect(merged.lines).toEqual([
      { nftId: 'nft-001', editionId: 'nft-001-std', quantity: 1 },
      { nftId: 'nft-002', editionId: 'nft-002-std', quantity: 2 },
    ])
  })

  test('cupom do usuário prevalece; sem cupom, herda o do visitante', () => {
    expect(mergeGuestIntoUserCart(cart([], 'ETH005'), cart([], 'JUNGLE10'), availableOf).couponCode).toBe(
      'ETH005',
    )
    expect(mergeGuestIntoUserCart(cart([]), cart([], 'JUNGLE10'), availableOf).couponCode).toBe('JUNGLE10')
    expect(mergeGuestIntoUserCart(cart([]), cart([]), availableOf).couponCode).toBeNull()
  })

  test('não altera os carrinhos de entrada', () => {
    const user = cart([['nft-002', 'nft-002-std', 2]])
    const guest = cart([['nft-002', 'nft-002-std', 3]], 'JUNGLE10')
    const snapshot = structuredClone({ user, guest })

    mergeGuestIntoUserCart(user, guest, availableOf)

    expect({ user, guest }).toEqual(snapshot)
  })
})
