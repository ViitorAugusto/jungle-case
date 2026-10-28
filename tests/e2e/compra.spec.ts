import { api, apiAfter } from '../support/api.ts'
import { addToCartFromDetail, collectorOf, prepareCheckout } from '../support/flows.ts'
import { CartPage, expectSummaryIn, RECEIPT_SUMMARY_LABELS } from '../support/pages/cart-page.ts'
import { CatalogPage } from '../support/pages/catalog-page.ts'
import { CheckoutPage, ReceiptPage } from '../support/pages/checkout-pages.ts'
import { NftDetailPage } from '../support/pages/nft-detail-page.ts'
import { loginAs } from '../support/session.ts'
import { testData } from '../support/test-data.ts'
import { expect, test } from '../support/test.ts'

/**
 * T06 — compra completa do catálogo ao recibo confirmado (R02–R06, R24, R25,
 * R29–R31). A confirmação só aparece depois que a simulação confirma (R29).
 */

const { alex } = testData.users
const { alexPrimaryAddress, alexPrimaryNickname } = testData.wallets
const collector = collectorOf(alex)
const NOTE = 'Entregar na carteira principal'
const OTHER_ADDRESS = '0x3333333333333333333333333333333333333333'
const PAYMENT = { scenario: 'payment-confirmed', paymentDelayMs: 1_500 } as const
/** O frame mobile do Pagamento mostra só as carteiras; o formulário completo é do desktop. */
const FORM_ONLY_DESKTOP = 'Formulário do colecionador só no desktop (Figma)'

test.describe('compra completa', () => {
  test('do catálogo ao recibo confirmado', async ({ page, mock }) => {
    test.skip(Boolean(test.info().project.use.isMobile), FORM_ONLY_DESKTOP)
    const catalog = new CatalogPage(page)
    const detail = new NftDetailPage(page)
    const cart = new CartPage(page)
    const checkout = new CheckoutPage(page)
    const receipt = new ReceiptPage(page)

    // Catálogo → detalhe
    await loginAs(page, mock, alex, '/', PAYMENT)
    const { body: list } = await catalog.listAfter(
      () => page.reload(),
      (url) => !url.searchParams.has('featured'),
    )
    const chosen = list.items.at(0)
    if (!chosen) throw new Error('Catálogo padrão sem itens')
    const nft = await detail.loadAfter(chosen.id, () => catalog.card(chosen.name).click())
    const edition = nft.editions.find((candidate) => candidate.available > 0)
    if (!edition) throw new Error(`${nft.name} sem edição disponível`)

    // Detalhe → carrinho
    await apiAfter(page, 'cart', api.addCartItem, () => detail.addToCartWith(edition.name, 1))
    await page.goto(CartPage.path)
    await expect(cart.line(nft.name).quantity).toHaveValue('1')

    // Carrinho → pagamento: perfil e carteira principal pré-preenchidos (premissa 23)
    await cart.checkout.click()
    await expect(page).toHaveURL(CheckoutPage.path)
    await expect(checkout.displayName).toHaveValue(alex.name)
    await expect(checkout.email).toHaveValue(alex.email)
    await expect(checkout.savedWalletSelect).toContainText(alexPrimaryNickname)
    await expect(checkout.networkSelect).toContainText('Ethereum')
    await expect(checkout.walletAddress).toHaveValue(alexPrimaryAddress)
    await expect(checkout.walletAddress).not.toBeEditable()
    await checkout.fillPayment({ ...collector, note: NOTE })
    await expect(checkout.summaryRegion).toContainText(nft.name)

    // Um único "Confirmar compra" conecta a carteira, cota, revalida e envia: o
    // pedido leva colecionador e carteira e nasce pendente (R29)
    const { body: order } = await apiAfter(page, 'order', api.createOrder, () => checkout.confirm.click())
    expect(order.status).toBe('pending')
    expect(order.collector).toEqual({
      displayName: alex.name,
      username: collector.username,
      profileName: collector.profileName,
      email: alex.email,
      ensName: `${collector.ensLabel}.eth`,
      referralCode: collector.referralCode,
      note: NOTE,
    })
    expect(order.payment).toMatchObject({
      network: 'ethereum',
      address: alexPrimaryAddress,
      secondaryAddressOrEns: null,
      provider: 'metamask',
    })
    await expect(checkout.pending).toBeVisible()
    await expect(receipt.confirmed).toBeHidden()

    // Confirmação pela simulação → recibo com o snapshot do pedido
    const { body: snapshot } = await apiAfter(page, 'receipt', api.receipt, () =>
      page.waitForURL(ReceiptPage.path(order.id)),
    )
    await expect(receipt.confirmed).toBeVisible()
    await expect(receipt.transaction).toContainText(snapshot.transaction.hash)
    await expect(receipt.transaction).toContainText(`${snapshot.summary.totalEth} ETH`)
    await expect(receipt.transaction).toContainText('MetaMask')
    await expect(receipt.explorerLink).toHaveAccessibleName(/^Ver no Etherscan/)
    await expect(receipt.explorerLink).toHaveAttribute('href', snapshot.transaction.explorerUrl)
    await expect(receipt.items).toHaveCount(snapshot.lines.length)
    await expect(receipt.items.first()).toContainText(nft.name)
    await expectSummaryIn(receipt.details, snapshot.summary, RECEIPT_SUMMARY_LABELS)
    expect(snapshot.collector).toEqual(order.collector)
    expect(snapshot.payment).toEqual(order.payment)

    // Só os itens comprados saem do carrinho (R30)
    await page.goto(CartPage.path)
    await expect(cart.emptyState).toBeVisible()
  })

  test('outra carteira, ENS secundário e provedor escolhido vão no pedido e no recibo', async ({
    page,
    mock,
  }) => {
    test.skip(Boolean(test.info().project.use.isMobile), FORM_ONLY_DESKTOP)
    const checkout = new CheckoutPage(page)
    const receipt = new ReceiptPage(page)
    const { available } = testData.nfts
    await loginAs(page, mock, alex, '/', PAYMENT)
    await addToCartFromDetail(page, available.id, available.editionId)
    await page.goto(CheckoutPage.path)

    await checkout.useWallet('Ethereum', OTHER_ADDRESS)
    await expect(checkout.savedWalletSelect).not.toContainText(alexPrimaryNickname)
    await checkout.secondaryWallet.fill('reserva.eth')
    await checkout.fillPayment(collector, 'Coinbase Wallet', { connect: false })
    await expect(checkout.walletType('Coinbase Wallet')).toBeChecked()
    const { body: order } = await apiAfter(page, 'order', api.createOrder, () => checkout.confirm.click())

    expect(order.payment).toMatchObject({
      network: 'ethereum',
      address: OTHER_ADDRESS,
      secondaryAddressOrEns: 'reserva.eth',
      provider: 'coinbase',
      walletId: null,
    })
    await page.waitForURL(ReceiptPage.path(order.id))
    await expect(receipt.transaction).toContainText('Coinbase Wallet')
  })

  test('confirmação remove só a quantidade comprada e mantém o resto', async ({ page, mock }) => {
    const cart = new CartPage(page)
    const checkout = new CheckoutPage(page)
    const { partiallySoldOut } = testData.nfts
    const { nft } = await prepareCheckout(page, mock, PAYMENT)
    const { body: order } = await apiAfter(page, 'order', api.createOrder, () => checkout.confirm.click())
    await page.waitForURL(ReceiptPage.path(order.id))

    // Item adicionado depois do envio não pode sumir com a confirmação.
    const { nft: other } = await addToCartFromDetail(
      page,
      partiallySoldOut.id,
      partiallySoldOut.availableEditionId,
    )
    await page.goto(CartPage.path)

    await expect(cart.line(other.name).quantity).toHaveValue('1')
    await expect(cart.line(nft.name).root).toHaveCount(0)
  })

  test('recibo por acesso direto e após refresh é o snapshot do pedido', async ({ page, mock }) => {
    const checkout = new CheckoutPage(page)
    const receipt = new ReceiptPage(page)
    const { available } = testData.nfts
    await prepareCheckout(page, mock, PAYMENT)
    const { body: order } = await apiAfter(page, 'order', api.createOrder, () => checkout.confirm.click())
    await page.waitForURL(ReceiptPage.path(order.id))
    await expect(receipt.confirmed).toBeVisible()

    // Preço muda no catálogo depois da compra: o recibo não muda (R31).
    await mock.updateNft({ nftId: available.id, editionId: available.editionId, priceEth: '9.99' })
    const { body: snapshot } = await apiAfter(page, 'receipt', api.receipt, () => page.reload())

    await expect(receipt.confirmed).toBeVisible()
    await expectSummaryIn(receipt.details, snapshot.summary, RECEIPT_SUMMARY_LABELS)
    await expect(receipt.details).not.toContainText('9.99')
  })
})
