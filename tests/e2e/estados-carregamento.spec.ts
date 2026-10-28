import { addToCartFromDetail } from '../support/flows.ts'
import { CartPage } from '../support/pages/cart-page.ts'
import { CatalogPage } from '../support/pages/catalog-page.ts'
import { NftDetailPage } from '../support/pages/nft-detail-page.ts'
import { testData } from '../support/test-data.ts'
import { expect, test } from '../support/test.ts'

/**
 * T12 — skeleton em carregamento lento, feedback de falha e recuperação após
 * nova tentativa (R15, R40, R53, R67).
 */

const SKELETON = '[data-slot="skeleton"]'
const detailPath = NftDetailPage.path(testData.nfts.available.id)

test.describe('skeleton', () => {
  test('catálogo mostra skeleton com as dimensões da lista', async ({ page, mock }) => {
    const catalog = new CatalogPage(page)
    await mock.open('/', { scenario: 'latency-fixed' })

    await expect(catalog.results).toHaveAttribute('aria-busy', 'true')
    await expect(catalog.results.locator(SKELETON).first()).toBeVisible()
    const loading = await catalog.results.boundingBox()

    await expect(catalog.results).not.toHaveAttribute('aria-busy', 'true')
    await expect(catalog.cardTitles.first()).toBeVisible()
    const loaded = await catalog.results.boundingBox()

    expect(loading?.width).toBe(loaded?.width)
    expect(Math.abs((loading?.height ?? 0) - (loaded?.height ?? 0))).toBeLessThanOrEqual(
      (loaded?.height ?? 0) * 0.1,
    )
  })

  test('detalhe mostra skeleton até a resposta chegar', async ({ page, mock }) => {
    const detail = new NftDetailPage(page)
    await mock.open(detailPath, { scenario: 'latency-fixed' })

    await expect(page.locator(SKELETON).first()).toBeVisible()
    await expect(detail.title).toBeVisible()
    await expect(page.locator(SKELETON)).toHaveCount(0)
  })

  test('resumo do carrinho mostra skeleton durante a recotação', async ({ page, mock }) => {
    const cart = new CartPage(page)
    await mock.open('/')
    const { nft } = await addToCartFromDetail(
      page,
      testData.nfts.available.id,
      testData.nfts.available.editionId,
    )
    await page.goto(CartPage.path)
    await mock.setScenario({ scenario: 'latency-fixed' })

    await cart.line(nft.name).increase.click()

    await expect(cart.summary.locator(SKELETON).first()).toBeVisible()
    await expect(cart.summary.locator(SKELETON)).toHaveCount(0)
  })

  test('com movimento reduzido o shimmer não anima', async ({ page, mock }) => {
    // `reducedMotion: 'reduce'` está na configuração do projeto.
    await mock.open('/', { scenario: 'latency-fixed' })
    const skeleton = page.locator(SKELETON).filter({ visible: true }).first()
    await expect(skeleton).toBeVisible()

    // Sem animação, ou reduzida a uma única iteração instantânea (sem movimento perceptível).
    const animations = await skeleton.evaluate((element) =>
      [getComputedStyle(element), getComputedStyle(element, '::after')].map((style) => ({
        name: style.animationName,
        seconds: Number.parseFloat(style.animationDuration) || 0,
        iterations: style.animationIterationCount,
      })),
    )

    for (const { name, seconds, iterations } of animations) {
      expect(name === 'none' || name === '' || (seconds <= 0.001 && iterations === '1')).toBe(true)
    }
  })
})

test.describe('falha e nova tentativa', () => {
  test('detalhe com falha transitória mostra erro e recupera', async ({ page, mock }) => {
    const detail = new NftDetailPage(page)
    await mock.open('/')
    await mock.failNext({
      method: 'GET',
      path: `/nfts/${testData.nfts.available.id}`,
      status: 503,
      count: 10,
    })

    // As falhas programadas vivem no worker da página: navegação no cliente, sem recarregar.
    await page.evaluate((path) => {
      window.history.pushState({}, '', path)
      window.dispatchEvent(new PopStateEvent('popstate'))
    }, detailPath)
    await expect(page.getByRole('alert')).toBeVisible({ timeout: 15_000 })

    await mock.setScenario({ scenario: 'success' })
    await page.getByRole('button', { name: 'Tentar novamente' }).click()

    await expect(detail.title).toBeVisible()
    await expect(page.getByRole('alert')).toBeHidden()
  })

  test('sem conexão mostra aviso próprio e recupera', async ({ page, mock }) => {
    const catalog = new CatalogPage(page)
    await mock.open('/', { scenario: 'offline' })

    await expect(catalog.errorAlert).toContainText(/conexão/i)

    await mock.setScenario({ scenario: 'success' })
    await catalog.retry.click()
    await expect(catalog.cardTitles.first()).toBeVisible()
  })

  test('timeout do catálogo vira erro com nova tentativa', async ({ page, mock }) => {
    test.slow()
    const catalog = new CatalogPage(page)
    await mock.open('/', { scenario: 'timeout' })

    // 10 s por tentativa, com até 2 novas tentativas automáticas e backoff (query-client).
    await expect(catalog.errorAlert).toBeVisible({ timeout: 45_000 })

    await mock.setScenario({ scenario: 'success' })
    await catalog.retry.click()
    await expect(catalog.cardTitles.first()).toBeVisible()
  })

  test('latência variável termina com os dados da última consulta', async ({ page, mock }) => {
    const catalog = new CatalogPage(page)
    await mock.open('/', { scenario: 'latency-variable' })

    const { body } = await catalog.listAfter(
      () => catalog.sortBy('Menor preço'),
      (url) => url.searchParams.get('sort') === 'price-asc',
    )

    await expect(catalog.cardTitles).toHaveText(body.items.map((item) => item.name))
  })
})
