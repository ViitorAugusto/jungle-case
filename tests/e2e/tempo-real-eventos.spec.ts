import { api, apiAfter, recordCalls } from '../support/api.ts'
import { addToCartFromDetail, prepareCheckout } from '../support/flows.ts'
import { AccountMenu, LoginPage } from '../support/pages/account-pages.ts'
import { CartPage } from '../support/pages/cart-page.ts'
import { CheckoutPage, ReceiptPage } from '../support/pages/checkout-pages.ts'
import { NftDetailPage } from '../support/pages/nft-detail-page.ts'
import { testData } from '../support/test-data.ts'
import { expect, FIXED_NOW, test } from '../support/test.ts'

/**
 * T10 — eventos duplicados ou antigos, desconexão e retomada de pedido
 * pendente (R28, R59–R62, R64).
 */

const { available } = testData.nfts
const target = { nftId: available.id, editionId: available.editionId }

const waitForSocket = async (mock: { state(): Promise<{ connectionCount: number }> }) => {
  // Reconexão do socket.io com backoff (1 s, 2 s, 4 s) pode passar de 5 s após uma queda.
  await expect.poll(async () => (await mock.state()).connectionCount, { timeout: 15_000 }).toBeGreaterThan(0)
}

test.describe('eventos fora de ordem', () => {
  test('evento duplicado não repete o aviso nem a atualização', async ({ page, mock }) => {
    const cart = new CartPage(page)
    await mock.open('/')
    const { nft } = await addToCartFromDetail(page, available.id, available.editionId)
    await page.goto(CartPage.path)
    // O evento só vira aviso se o carrinho já foi lido antes dele.
    await expect(cart.line(nft.name).root).toBeVisible()
    await waitForSocket(mock)
    await mock.updateNft({ ...target, priceEth: '5.5' })
    await expect(cart.changeNotice).toHaveCount(1)
    const cartRefetches = recordCalls(page, api.getCart)

    await mock.resendLastEvent()

    await expect(cart.line(nft.name).root).toContainText('5.5 ETH')
    await expect(cart.changeNotice).toHaveCount(1)
    expect(cartRefetches).toHaveLength(0)
  })

  test('evento com versão antiga não regride o preço', async ({ page, mock }) => {
    const detail = new NftDetailPage(page)
    const nft = await detail.loadAfter(available.id, () => mock.open(NftDetailPage.path(available.id)))
    const original = nft.editions.find((edition) => edition.id === available.editionId)?.priceEth
    if (!original) throw new Error('Fixture de edição disponível mudou')
    await waitForSocket(mock)
    await mock.updateNft({ ...target, priceEth: '5.5' })
    await expect(page.getByText('5.5 ETH').filter({ visible: true }).first()).toBeVisible()

    await mock.sendStaleNftEvent(available.id, original)

    await expect(page.getByText('5.5 ETH').filter({ visible: true }).first()).toBeVisible()
    await expect(page.getByText(`${original} ETH`)).toHaveCount(0)
  })
})

test.describe('desconexão', () => {
  test('mudança perdida durante a queda é reconciliada por REST ao reconectar', async ({ page, mock }) => {
    const cart = new CartPage(page)
    await mock.open('/')
    const { nft } = await addToCartFromDetail(page, available.id, available.editionId)
    await page.goto(CartPage.path)
    await expect(cart.line(nft.name).root).toBeVisible()
    await waitForSocket(mock)

    await mock.disconnectSocket(4_000)
    await expect.poll(async () => (await mock.state()).connectionCount).toBe(0)
    await mock.updateNft({ ...target, priceEth: '6.6' })
    await expect(cart.line(nft.name).root).not.toContainText('6.6 ETH')

    await waitForSocket(mock)
    await expect(cart.line(nft.name).root).toContainText('6.6 ETH')
  })

  test('estado da conexão é anunciado na queda e na volta', async ({ page, mock }) => {
    await mock.open('/')
    await waitForSocket(mock)

    await mock.disconnectSocket(2_000)
    await expect(page.getByRole('status').filter({ hasText: /reconectando|sem conexão/i })).toBeVisible()

    await waitForSocket(mock)
    await expect(page.getByRole('status').filter({ hasText: /reconectando|sem conexão/i })).toBeHidden()
  })
})

test.describe('pedido pendente', () => {
  test('pendente sobrevive a refresh e termina confirmado sem nova compra', async ({ page, mock }) => {
    const checkout = new CheckoutPage(page)
    const receipt = new ReceiptPage(page)
    await prepareCheckout(page, mock, { scenario: 'payment-confirmed', paymentDelayMs: 4_000 })
    const orders = recordCalls(page, api.createOrder)
    const { body: order } = await apiAfter(page, 'order', api.createOrder, () => checkout.confirm.click())
    await expect(checkout.pending).toBeVisible()

    await page.reload()

    await expect(checkout.pending.or(receipt.confirmed)).toBeVisible()
    await page.waitForURL(ReceiptPage.path(order.id))
    await expect(receipt.confirmed).toBeVisible()
    expect(new Set(orders.map((call) => call.headers['idempotency-key'])).size).toBe(1)
  })

  test('confirmação durante a queda do socket é recuperada ao reconectar', async ({ page, mock }) => {
    const checkout = new CheckoutPage(page)
    const receipt = new ReceiptPage(page)
    await prepareCheckout(page, mock, { scenario: 'payment-confirmed', paymentDelayMs: 1_000 })
    const { body: order } = await apiAfter(page, 'order', api.createOrder, () => checkout.confirm.click())
    await expect(checkout.pending).toBeVisible()

    // A liquidação acontece com o socket fora do ar: o order.updated se perde.
    await mock.disconnectSocket(3_000)

    await page.waitForURL(ReceiptPage.path(order.id), { timeout: 10_000 })
    await expect(receipt.confirmed).toBeVisible()
  })

  test('recusa é terminal: evento antigo de pendente não reabre o pedido', async ({ page, mock }) => {
    const checkout = new CheckoutPage(page)
    await prepareCheckout(page, mock, { scenario: 'payment-rejected', paymentDelayMs: 500 })
    await apiAfter(page, 'order', api.createOrder, () => checkout.confirm.click())
    await expect(checkout.rejected).toBeVisible()

    await mock.resendLastEvent()
    await page.reload()

    await expect(checkout.pending).toBeHidden()
  })
})

test.describe('isolamento entre sessões', () => {
  test.use({ clockAt: FIXED_NOW })

  test('pedido do usuário anterior não atualiza a sessão do próximo', async ({ page, mock }) => {
    const checkout = new CheckoutPage(page)
    await prepareCheckout(page, mock, { scenario: 'payment-confirmed', paymentDelayMs: 60_000 })
    await apiAfter(page, 'order', api.createOrder, () => checkout.confirm.click())
    await expect(checkout.pending).toBeVisible()

    await new AccountMenu(page).logout()
    await page.goto(`${LoginPage.path}?redirect=%2F`)
    await new LoginPage(page).loginWith(testData.users.bia)
    // O pedido do Alex liquida com a Bia logada.
    await page.clock.runFor(61_000)

    await expect(page).not.toHaveURL(/\/pedidos\//)
    await expect(page.getByRole('heading', { name: 'Compra confirmada' })).toBeHidden()
    await expect(page.getByRole('status').filter({ hasText: /pedido|compra/i })).toHaveCount(0)
  })
})
