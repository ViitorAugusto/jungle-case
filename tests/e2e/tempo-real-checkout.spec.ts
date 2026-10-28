import { api, apiAfter, recordCalls } from '../support/api.ts'
import { addToCartFromDetail, prepareCheckout } from '../support/flows.ts'
import { CartPage } from '../support/pages/cart-page.ts'
import { CatalogPage } from '../support/pages/catalog-page.ts'
import { CheckoutPage, ReceiptPage } from '../support/pages/checkout-pages.ts'
import { NftDetailPage } from '../support/pages/nft-detail-page.ts'
import { testData } from '../support/test-data.ts'
import { expect, test } from '../support/test.ts'

/**
 * T09 — preço e disponibilidade via Socket.IO (R22, R26, R58, R63). Os
 * eventos saem do servidor simulado (`/__mock/events/nft-updated`) e chegam
 * pelo `socket.io-client`; a página não é recarregada em nenhum momento.
 */

const { available } = testData.nfts
const NEW_PRICE = '7.77'
const LOWEST_PRICE = '0.07'

test.describe('tempo real no catálogo, detalhe e carrinho', () => {
  test('nft.updated atualiza o preço no detalhe sem recarregar', async ({ page, mock }) => {
    const detail = new NftDetailPage(page)
    await detail.loadAfter(available.id, () => mock.open(NftDetailPage.path(available.id)))
    await expect.poll(async () => (await mock.state()).connectionCount).toBeGreaterThan(0)

    await mock.updateNft({ nftId: available.id, editionId: available.editionId, priceEth: NEW_PRICE })

    // No mobile o preço do layout desktop fica no DOM, oculto.
    await expect(page.getByText(`${NEW_PRICE} ETH`).filter({ visible: true }).first()).toBeVisible()
  })

  test('nft.updated atualiza o card do catálogo', async ({ page, mock }) => {
    const catalog = new CatalogPage(page)
    const { body } = await catalog.listAfter(
      () => mock.open('/'),
      (url) => !url.searchParams.has('featured'),
    )
    const first = body.items.at(0)
    if (!first) throw new Error('Catálogo padrão sem itens')
    await expect.poll(async () => (await mock.state()).connectionCount).toBeGreaterThan(0)

    // O card mostra o menor preço entre as edições: o novo preço fica abaixo de todos.
    await mock.updateNft({ nftId: first.id, priceEth: LOWEST_PRICE })

    await expect(catalog.results.getByRole('listitem').filter({ hasText: first.name })).toContainText(
      `${LOWEST_PRICE} ETH`,
    )
  })

  test('preço novo com o carrinho aberto avisa e recota o resumo', async ({ page, mock }) => {
    const cart = new CartPage(page)
    await mock.open('/')
    const { nft } = await addToCartFromDetail(page, available.id, available.editionId)
    await page.goto(CartPage.path)
    // O evento só vira aviso se o carrinho já foi lido antes dele.
    await expect(cart.line(nft.name).root).toBeVisible()
    await expect.poll(async () => (await mock.state()).connectionCount).toBeGreaterThan(0)

    const { body } = await apiAfter(page, 'cart', api.getCart, () =>
      mock.updateNft({ nftId: available.id, editionId: available.editionId, priceEth: NEW_PRICE }),
    )

    await expect(cart.line(nft.name).root).toContainText(`${NEW_PRICE} ETH`)
    await expect(cart.changeNotice).toContainText(nft.name)
    await cart.expectSummary(body.summary)
  })

  test('disponibilidade abaixo da quantidade no carrinho avisa e limita', async ({ page, mock }) => {
    const cart = new CartPage(page)
    await mock.open('/')
    const { nft } = await addToCartFromDetail(page, available.id, available.editionId, 3)
    await page.goto(CartPage.path)
    await expect(cart.line(nft.name).root).toBeVisible()
    await expect.poll(async () => (await mock.state()).connectionCount).toBeGreaterThan(0)

    await mock.updateNft({ nftId: available.id, editionId: available.editionId, available: 1 })

    await expect(cart.changeNotice).toContainText(nft.name)
    await expect(cart.line(nft.name).root).toContainText(/resta 1|1 disponível/i)
    await expect(cart.line(nft.name).increase).toBeDisabled()
  })
})

test.describe('tempo real durante o checkout', () => {
  test('preço muda depois da cotação: o diálogo mostra a mudança e pede nova confirmação', async ({
    page,
    mock,
  }) => {
    const checkout = new CheckoutPage(page)
    const receipt = new ReceiptPage(page)
    await prepareCheckout(page, mock)
    // `price-changed`: 1 s depois da cotação o preço do primeiro item sobe 10% (nft.updated).
    // A latência de 1,5 s (aplicada depois do handler) faz a revalidação já ver o preço novo.
    await mock.setScenario({ scenario: 'price-changed', latencyMs: 1_500, paymentDelayMs: 500 })
    const orders = recordCalls(page, api.createOrder)

    const { body: quote } = await apiAfter(page, 'quote', api.createQuote, () => checkout.confirm.click())
    await expect(checkout.changesDialog).toBeVisible()
    await expect(checkout.changesDialog.getByRole('alert')).toContainText(/mudou/)
    expect(orders).toHaveLength(0)

    const { body: order } = await apiAfter(page, 'order', api.createOrder, () =>
      checkout.confirmChanges.click(),
    )
    expect(order.summary.totalEth).not.toBe(quote.summary.totalEth)
    await page.waitForURL(ReceiptPage.path(order.id))
    await expect(receipt.confirmed).toBeVisible()
  })

  test('esgotou antes de confirmar: aviso e nenhum pedido', async ({ page, mock }) => {
    const checkout = new CheckoutPage(page)
    await prepareCheckout(page, mock)
    const orders = recordCalls(page, api.createOrder)

    await mock.updateNft({ nftId: available.id, editionId: available.editionId, available: 0 })
    await checkout.confirm.click()

    await expect(checkout.soldOut.first()).toBeVisible()
    await expect(checkout.pending).toBeHidden()
    expect(orders).toHaveLength(0)
  })

  test('cotação desatualizada também é recusada pelo servidor', async ({ page, mock }) => {
    const checkout = new CheckoutPage(page)
    // `quote-outdated-on-order`: no primeiro envio o preço sobe só no servidor, sem evento,
    // depois da revalidação do cliente; quem recusa é a API.
    await prepareCheckout(page, mock, { scenario: 'quote-outdated-on-order' })

    const { body } = await apiAfter(page, 'error', api.createOrder, () => checkout.confirm.click())

    expect(body.reason).toBe('QUOTE_OUTDATED')
    await expect(checkout.quoteChanged).toBeVisible()
    await expect(checkout.reviewAgain).toBeVisible()
  })
})
