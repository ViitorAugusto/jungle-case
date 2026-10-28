import type { Page } from '@playwright/test'

import { LoginPage } from '../support/pages/account-pages.ts'
import { NftDetailPage } from '../support/pages/nft-detail-page.ts'
import { loginAs } from '../support/session.ts'
import { testData } from '../support/test-data.ts'
import { expect, test } from '../support/test.ts'

/**
 * T04 — favoritos com falha de mutation e recuperação (R17, R41, R46, R73).
 * A latência alta deixa o estado otimista observável antes da resposta.
 */

const nftId = testData.nfts.available.id
const detailPath = NftDetailPage.path(nftId)
const SLOW = { latencyMs: 1_500 }

const favoriteResponse = (page: Page, method: 'PUT' | 'DELETE') =>
  page.waitForResponse(
    (response) =>
      response.request().method() === method && new URL(response.url()).pathname.includes('/api/favorites/'),
  )

/** Toasts do sonner: região viva "Notificações". */
const notifications = (page: Page) => page.getByRole('region', { name: /^Notificações/ })

test.describe('favoritos', () => {
  test('visitante é levado ao login ao favoritar', async ({ page, mock }) => {
    const detail = new NftDetailPage(page)
    await mock.open(detailPath)

    await detail.favorite.click()

    await new LoginPage(page).expectRedirectTo(detailPath)
  })

  test('favoritar é otimista, persiste após refresh e aparece em Favoritos', async ({ page, mock }) => {
    const detail = new NftDetailPage(page)
    await loginAs(page, mock, testData.users.alex, detailPath, SLOW)
    const nft = await detail.loadAfter(nftId, () => page.reload())

    const saved = page.waitForResponse((response) => response.request().method() === 'PUT' && response.ok())
    await detail.favorite.click()
    await expect(detail.favorite).toHaveAttribute('aria-pressed', 'true')
    await saved

    await page.reload()
    await expect(detail.favorite).toHaveAttribute('aria-pressed', 'true')
    await page.goto('/favoritos')
    await expect(page.getByRole('link', { name: nft.name })).toBeVisible()
  })

  test('falha ao favoritar desfaz o estado e avisa', async ({ page, mock }) => {
    const detail = new NftDetailPage(page)
    await loginAs(page, mock, testData.users.alex, detailPath, SLOW)
    await mock.failNext({ method: 'PUT', path: '/favorites', status: 503, count: 1 })

    await detail.favorite.click()
    await expect(detail.favorite).toHaveAttribute('aria-pressed', 'true')

    await expect(detail.favorite).toHaveAttribute('aria-pressed', 'false')
    await expect(notifications(page)).toContainText(/favorit/i)
  })

  test('nova tentativa após a falha salva o favorito', async ({ page, mock }) => {
    const detail = new NftDetailPage(page)
    await loginAs(page, mock, testData.users.alex, detailPath)
    await mock.failNext({ method: 'PUT', path: '/favorites', status: 503, count: 1 })
    await Promise.all([favoriteResponse(page, 'PUT'), detail.favorite.click()])
    await expect(detail.favorite).toHaveAttribute('aria-pressed', 'false')

    await Promise.all([favoriteResponse(page, 'PUT'), detail.favorite.click()])

    await expect(detail.favorite).toHaveAttribute('aria-pressed', 'true')
    await page.reload()
    await expect(detail.favorite).toHaveAttribute('aria-pressed', 'true')
  })

  test('falha ao desfavoritar mantém o favorito', async ({ page, mock }) => {
    const detail = new NftDetailPage(page)
    await loginAs(page, mock, testData.users.alex, detailPath)
    await Promise.all([favoriteResponse(page, 'PUT'), detail.favorite.click()])
    await expect(detail.favorite).toHaveAttribute('aria-pressed', 'true')
    await mock.failNext({ method: 'DELETE', path: '/favorites', status: 503, count: 1 })

    await Promise.all([favoriteResponse(page, 'DELETE'), detail.favorite.click()])

    await expect(detail.favorite).toHaveAttribute('aria-pressed', 'true')
    await page.reload()
    await expect(detail.favorite).toHaveAttribute('aria-pressed', 'true')
  })
})
