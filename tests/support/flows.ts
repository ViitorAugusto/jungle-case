import type { Page } from '@playwright/test'

import { api, apiAfter, type CartBody, type QuoteBody } from './api.ts'
import type { MockControl, MockOptions } from './mock-control.ts'
import { CartPage } from './pages/cart-page.ts'
import { CheckoutPage, type CollectorInput } from './pages/checkout-pages.ts'
import { NftDetailPage, type NftBody } from './pages/nft-detail-page.ts'
import { loginAs } from './session.ts'
import { testData } from './test-data.ts'

/**
 * Abre o detalhe do NFT e adiciona `quantity` unidades da edição ao carrinho
 * pela interface. Não reseta o mock: chame depois de `mock.open`.
 */
export const addToCartFromDetail = async (
  page: Page,
  nftId: string,
  editionId: string,
  quantity = 1,
): Promise<{ nft: NftBody; edition: NftBody['editions'][number]; cart: CartBody }> => {
  const detail = new NftDetailPage(page)
  const nft = await detail.loadAfter(nftId, () => page.goto(NftDetailPage.path(nftId)))
  const edition = nft.editions.find((candidate) => candidate.id === editionId)
  if (!edition) throw new Error(`Edição ${editionId} não existe em ${nftId}`)

  const { body: cart } = await apiAfter(page, 'cart', api.addCartItem, () =>
    detail.addToCartWith(edition.name, quantity),
  )
  return { nft, edition, cart }
}

/**
 * Campos do colecionador que o perfil não preenche (premissa 23). Nome de
 * exibição e e-mail vêm do perfil; rede e endereço, da carteira principal.
 */
export const collectorOf = (user: { name: string; email: string }): CollectorInput => {
  const handle = user.email.split('@')[0] ?? 'colecionador'
  return {
    username: `${handle}_kurio`,
    profileName: user.name,
    ensLabel: handle,
    referralCode: 'JNG-2026',
  }
}

/**
 * Leva o Alex do login até a revisão do pedido com um item no carrinho e
 * devolve o NFT, a edição e a cotação usada na revisão. O próximo passo é
 * `CheckoutPage.confirm`.
 */
export const prepareCheckout = async (
  page: Page,
  mock: MockControl,
  options: MockOptions & { nftId?: string; editionId?: string; quantity?: number } = {},
): Promise<{ nft: NftBody; edition: NftBody['editions'][number]; quote: QuoteBody }> => {
  const {
    nftId = testData.nfts.available.id,
    editionId = testData.nfts.available.editionId,
    quantity = 1,
    ...mockOptions
  } = options
  const { alex } = testData.users
  await loginAs(page, mock, alex, '/', mockOptions)
  const { nft, edition } = await addToCartFromDetail(page, nftId, editionId, quantity)

  await page.goto(CartPage.path)
  await new CartPage(page).checkout.click()
  const checkout = new CheckoutPage(page)
  await checkout.fillPayment(collectorOf(alex))
  const { body: quote } = await apiAfter(page, 'quote', api.createQuote, () => checkout.review.click())
  return { nft, edition, quote }
}
