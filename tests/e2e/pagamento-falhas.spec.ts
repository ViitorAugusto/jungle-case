import { api, apiAfter, recordCalls, type OrderBody } from '../support/api.ts'
import { collectorOf, prepareCheckout } from '../support/flows.ts'
import { CartPage } from '../support/pages/cart-page.ts'
import { CheckoutPage, ReceiptPage } from '../support/pages/checkout-pages.ts'
import { testData } from '../support/test-data.ts'
import { expect, test } from '../support/test.ts'

/**
 * T07 — falha de pagamento, clique repetido e timeout com recuperação do
 * mesmo pedido (R27–R30, R44, R50). Nenhum caminho pode criar dois pedidos
 * para a mesma tentativa nem mostrar confirmação sem a simulação confirmar.
 */

const IDEMPOTENCY_HEADER = 'idempotency-key'
const keysOf = (calls: ReturnType<typeof recordCalls>) =>
  calls.map((call) => call.headers[IDEMPOTENCY_HEADER])
const orderIdsOf = (calls: ReturnType<typeof recordCalls>) =>
  calls.filter((call) => call.status !== null && call.status < 300).map((call) => (call.body as OrderBody).id)

test.describe('falhas de pagamento', () => {
  test('pagamento recusado preserva o carrinho e permite nova tentativa', async ({ page, mock }) => {
    const checkout = new CheckoutPage(page)
    const receipt = new ReceiptPage(page)
    const cart = new CartPage(page)
    const { nft } = await prepareCheckout(page, mock, { scenario: 'payment-rejected', paymentDelayMs: 1_000 })
    const orders = recordCalls(page, api.createOrder)

    await checkout.confirm.click()
    await expect(checkout.pending).toBeVisible()
    await expect(checkout.rejected).toBeVisible()
    await expect(receipt.confirmed).toBeHidden()
    await expect(page).not.toHaveURL(/\/pedidos\//)

    // Recusa é terminal: o carrinho continua e a nova compra usa outra chave.
    await page.goto(CartPage.path)
    await expect(cart.line(nft.name).quantity).toHaveValue('1')
    await mock.setScenario({ scenario: 'payment-confirmed', paymentDelayMs: 500 })
    await cart.checkout.click()
    await checkout.fillPayment(collectorOf(testData.users.alex))
    await apiAfter(page, 'quote', api.createQuote, () => checkout.review.click())
    const { body: order } = await apiAfter(page, 'order', api.createOrder, () => checkout.confirm.click())

    await page.waitForURL(ReceiptPage.path(order.id))
    await expect(receipt.confirmed).toBeVisible()
    const [firstKey, secondKey] = keysOf(orders)
    expect(firstKey).toBeTruthy()
    expect(secondKey).not.toBe(firstKey)
  })

  test('clique repetido em confirmar não cria pedido duplicado', async ({ page, mock }) => {
    const checkout = new CheckoutPage(page)
    await prepareCheckout(page, mock, { scenario: 'payment-confirmed', paymentDelayMs: 2_000 })
    const orders = recordCalls(page, api.createOrder)

    await checkout.confirm.click({ clickCount: 3 })
    await expect(checkout.pending).toBeVisible()
    await expect(checkout.confirm).toBeDisabled()

    await expect.poll(() => orders.every((call) => call.status !== null)).toBe(true)
    expect(new Set(keysOf(orders)).size).toBe(1)
    expect(new Set(orderIdsOf(orders)).size).toBe(1)
  })

  test('timeout depois de criar recupera o mesmo pedido com a mesma chave', async ({ page, mock }) => {
    // O servidor segura a 1ª resposta por 15 s e o cliente desiste em 10 s; a simulação só confirma
    // depois de 20 s, então a recuperação automática da premissa 25 fica visível.
    test.slow()
    const checkout = new CheckoutPage(page)
    const receipt = new ReceiptPage(page)
    await prepareCheckout(page, mock, { scenario: 'order-timeout-after-create', paymentDelayMs: 20_000 })
    const orders = recordCalls(page, api.createOrder)

    // Premissa 25: a recuperação é automática e anunciada, sem pedir ação do usuário.
    await checkout.confirm.click()
    await expect(checkout.recovering).toBeVisible({ timeout: 20_000 })
    await expect(receipt.confirmed).toBeHidden()
    await expect(checkout.retry).toBeHidden()

    await page.waitForURL(/\/pedidos\/[^/]+$/, { timeout: 20_000 })
    await expect(receipt.confirmed).toBeVisible()
    const keys = keysOf(orders)
    expect(keys.length).toBeGreaterThanOrEqual(2)
    expect(new Set(keys).size).toBe(1)
    const recoveredId = orderIdsOf(orders).at(0)
    expect(page.url()).toContain(ReceiptPage.path(recoveredId ?? ''))
  })

  test('refresh durante a tentativa reaproveita a chave em vez de criar outra', async ({ page, mock }) => {
    test.slow()
    const checkout = new CheckoutPage(page)
    await prepareCheckout(page, mock, { scenario: 'order-timeout-after-create', paymentDelayMs: 500 })
    const orders = recordCalls(page, api.createOrder)

    await checkout.confirm.click()
    await expect.poll(() => orders.length).toBe(1)
    await page.reload()

    await page.waitForURL(/\/pedidos\/[^/]+$/, { timeout: 20_000 })
    expect(new Set(keysOf(orders)).size).toBe(1)
  })

  test('edição esgotada no envio bloqueia a compra e mantém o carrinho', async ({ page, mock }) => {
    const checkout = new CheckoutPage(page)
    const receipt = new ReceiptPage(page)
    await prepareCheckout(page, mock, { scenario: 'edition-sold-out' })

    const { body } = await apiAfter(page, 'error', api.createOrder, () => checkout.confirm.click())

    expect(body.reason).toBe('EDITION_SOLD_OUT')
    await expect(checkout.soldOut).toBeVisible()
    await expect(receipt.confirmed).toBeHidden()
    await expect(page).toHaveURL(CheckoutPage.path)
  })
})
