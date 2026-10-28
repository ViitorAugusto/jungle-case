import { api, apiAfter } from '../support/api.ts'
import { addToCartFromDetail } from '../support/flows.ts'
import { AccountMenu, LoginPage } from '../support/pages/account-pages.ts'
import { CartPage } from '../support/pages/cart-page.ts'
import { loginAs } from '../support/session.ts'
import { testData } from '../support/test-data.ts'
import { expect, test } from '../support/test.ts'

/**
 * T05 — carrinho: quantidades, remoção, cupom, persistência após refresh e
 * login (R04, R18–R21, R23). Valores conferidos contra a resposta da API.
 */

const { available, partiallySoldOut } = testData.nfts
const { coupons } = testData

test.describe('carrinho', () => {
  test('item adicionado no detalhe aparece com quantidade e resumo da API', async ({ page, mock }) => {
    const cart = new CartPage(page)
    await mock.open('/')
    const { nft, cart: body } = await addToCartFromDetail(page, available.id, available.editionId, 2)

    await page.goto(CartPage.path)

    await expect(cart.lines).toHaveCount(1)
    await expect(cart.line(nft.name).quantity).toHaveValue('2')
    await cart.expectSummary(body.summary)
  })

  test('alterar quantidade recota e respeita o estoque da edição', async ({ page, mock }) => {
    const cart = new CartPage(page)
    await mock.open('/')
    const { nft, edition } = await addToCartFromDetail(page, available.id, available.editionId)
    await page.goto(CartPage.path)
    const line = cart.line(nft.name)

    const { body } = await apiAfter(page, 'cart', api.updateCartItem, () => line.increase.click())
    await expect(line.quantity).toHaveValue('2')
    await cart.expectSummary(body.summary)

    for (let quantity = 2; quantity < edition.available; quantity += 1) {
      await apiAfter(page, 'cart', api.updateCartItem, () => line.increase.click())
    }
    await expect(line.quantity).toHaveValue(String(edition.available))
    await expect(line.increase).toBeDisabled()
  })

  test('remover o último item mostra o carrinho vazio', async ({ page, mock }) => {
    const cart = new CartPage(page)
    await mock.open('/')
    const { nft } = await addToCartFromDetail(page, available.id, available.editionId)
    await page.goto(CartPage.path)

    await apiAfter(page, 'cart', api.removeCartItem, () => cart.line(nft.name).remove.click())

    await expect(cart.emptyState).toBeVisible()
    await expect(cart.checkout).toBeHidden()
  })

  test('linhas separadas por edição do mesmo NFT', async ({ page, mock }) => {
    const cart = new CartPage(page)
    await mock.open('/')
    await addToCartFromDetail(page, available.id, available.editionId)
    const { cart: body } = await addToCartFromDetail(
      page,
      partiallySoldOut.id,
      partiallySoldOut.availableEditionId,
    )

    await page.goto(CartPage.path)

    await expect(cart.lines).toHaveCount(body.lines.length)
    await cart.expectSummary(body.summary)
  })

  test.describe('cupom', () => {
    test('cupom válido aplica desconto da API e pode ser removido', async ({ page, mock }) => {
      const cart = new CartPage(page)
      await mock.open('/')
      await addToCartFromDetail(page, available.id, available.editionId)
      await page.goto(CartPage.path)

      const applied = await apiAfter(page, 'cart', api.applyCoupon, () => cart.useCoupon(coupons.valid))
      expect(applied.body.coupon?.code).toBe(coupons.valid)
      expect(applied.body.summary.discountEth).not.toBe('0')
      await cart.expectSummary(applied.body.summary)

      const removed = await apiAfter(page, 'cart', api.removeCoupon, () => cart.removeCoupon.click())
      expect(removed.body.summary.discountEth).toBe('0')
      await cart.expectSummary(removed.body.summary)
      await expect(cart.summary).not.toContainText(`(-) ${applied.body.summary.discountEth} ETH`)
    })

    for (const [label, code, message] of [
      ['inválido', coupons.invalid, /inválido|não existe/i],
      ['expirado', coupons.expired, /expir/i],
    ] as const) {
      test(`cupom ${label} mostra erro no campo e não altera o resumo`, async ({ page, mock }) => {
        const cart = new CartPage(page)
        await mock.open('/')
        const { cart: before } = await addToCartFromDetail(page, available.id, available.editionId)
        await page.goto(CartPage.path)

        const { status } = await apiAfter(page, 'error', api.applyCoupon, () => cart.useCoupon(code))

        expect(status).toBeGreaterThanOrEqual(400)
        await expect(cart.couponField).toHaveAttribute('aria-invalid', 'true')
        await expect(cart.couponField).toHaveAccessibleDescription(message)
        await cart.expectSummary(before.summary)
      })
    }
  })

  test.describe('persistência', () => {
    test('carrinho do visitante sobrevive a refresh', async ({ page, mock }) => {
      const cart = new CartPage(page)
      await mock.open('/')
      const { nft } = await addToCartFromDetail(page, available.id, available.editionId, 2)
      await page.goto(CartPage.path)

      await page.reload()

      await expect(cart.line(nft.name).quantity).toHaveValue('2')
    })

    test('itens do visitante são mesclados ao entrar a partir do checkout', async ({ page, mock }) => {
      const cart = new CartPage(page)
      await mock.open('/')
      const { nft } = await addToCartFromDetail(page, available.id, available.editionId, 2)
      await page.goto(CartPage.path)

      await cart.checkout.click()
      const login = new LoginPage(page)
      await login.expectRedirectTo('/checkout')
      await apiAfter(page, 'cart', api.mergeCart, () => login.loginWith(testData.users.alex))

      await expect(page).toHaveURL('/checkout')
      await page.goto(CartPage.path)
      await expect(cart.line(nft.name).quantity).toHaveValue('2')
    })

    test('mescla soma quantidades sem passar do estoque da edição', async ({ page, mock }) => {
      const cart = new CartPage(page)
      await loginAs(page, mock, testData.users.alex)
      const { nft, edition } = await addToCartFromDetail(page, available.id, available.editionId)
      await new AccountMenu(page).logout()

      await addToCartFromDetail(page, available.id, available.editionId, edition.available)
      await page.goto(`${LoginPage.path}?redirect=${encodeURIComponent(CartPage.path)}`)
      const { body } = await apiAfter(page, 'cart', api.mergeCart, () =>
        new LoginPage(page).loginWith(testData.users.alex),
      )

      expect(body.lines.find((line) => line.editionId === edition.id)?.quantity).toBe(edition.available)
      await expect(cart.line(nft.name).quantity).toHaveValue(String(edition.available))
    })
  })
})
