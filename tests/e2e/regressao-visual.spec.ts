import { addToCartFromDetail } from '../support/flows.ts'
import { CartPage } from '../support/pages/cart-page.ts'
import { CheckoutPage } from '../support/pages/checkout-pages.ts'
import { NftDetailPage } from '../support/pages/nft-detail-page.ts'
import { loginAs } from '../support/session.ts'
import { testData } from '../support/test-data.ts'
import { expect, FIXED_NOW, test } from '../support/test.ts'
import { prepareForScreenshot } from '../support/visual.ts'

/**
 * Regressão visual de Início, Detalhe, Carrinho e Pagamento (desktop e mobile).
 * Dados estáveis: banco simulado resetado, semente fixa e relógio fixo. As
 * baselines ficam por projeto e sistema operacional (premissa 10).
 */

const { available } = testData.nfts

test.use({ clockAt: FIXED_NOW })

test.describe('regressão visual', () => {
  test('Início', async ({ page, mock }) => {
    await mock.open('/')
    await expect(page.getByRole('list', { name: 'NFTs' }).getByRole('listitem').first()).toBeVisible()
    await prepareForScreenshot(page)

    await expect(page).toHaveScreenshot('inicio.png', { fullPage: true })
  })

  test('Detalhe', async ({ page, mock }) => {
    const detail = new NftDetailPage(page)
    await mock.open(NftDetailPage.path(available.id))
    await expect(detail.title).toBeVisible()
    await prepareForScreenshot(page)

    await expect(page).toHaveScreenshot('detalhe.png', { fullPage: true })
  })

  test('Carrinho', async ({ page, mock }) => {
    const cart = new CartPage(page)
    await mock.open('/')
    const { nft } = await addToCartFromDetail(page, available.id, available.editionId)
    await page.goto(CartPage.path)
    await expect(cart.line(nft.name).root).toBeVisible()
    await expect(cart.summary).toContainText('Total')
    await prepareForScreenshot(page)

    await expect(page).toHaveScreenshot('carrinho.png', { fullPage: true })
  })

  test('Pagamento', async ({ page, mock }) => {
    const checkout = new CheckoutPage(page)
    await loginAs(page, mock, testData.users.alex)
    await addToCartFromDetail(page, available.id, available.editionId)
    await page.goto(CheckoutPage.path)
    await expect(checkout.displayName).toHaveValue(testData.users.alex.name)
    await expect(checkout.reviewRegion).toContainText('Total')
    await prepareForScreenshot(page)

    await expect(page).toHaveScreenshot('pagamento.png', { fullPage: true })
  })
})
