import type { Locator, Page } from '@playwright/test'

import { LoginPage } from '../support/pages/account-pages.ts'
import { CatalogPage } from '../support/pages/catalog-page.ts'
import { NftDetailPage } from '../support/pages/nft-detail-page.ts'
import { testData } from '../support/test-data.ts'
import { expect, test } from '../support/test.ts'

/**
 * T11 — teclado, foco em diálogos e drawers, validação de formulários
 * (R68–R71, R74).
 */

const hasVisibleFocus = (locator: Locator) =>
  locator.evaluate((element) => {
    const style = getComputedStyle(element)
    return style.outlineStyle !== 'none' || style.boxShadow !== 'none'
  })

const hasHorizontalOverflow = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)

test.describe('teclado e foco', () => {
  test('Tab percorre o cabeçalho com foco visível', async ({ page, mock }) => {
    await mock.open('/')
    // Logo após o carregamento a janela ainda pode não ter foco: o Tab não entraria na página.
    await page.waitForLoadState('networkidle')
    await page.waitForFunction(() => document.hasFocus())

    for (let step = 0; step < 4; step += 1) {
      await page.keyboard.press('Tab')
      const focused = page.locator(':focus')
      await expect(focused).toBeVisible()
      expect(await hasVisibleFocus(focused)).toBe(true)
    }
  })

  test('card do catálogo abre o detalhe pelo Enter', async ({ page, mock }) => {
    const catalog = new CatalogPage(page)
    const { body } = await catalog.listAfter(
      () => mock.open('/'),
      (url) => !url.searchParams.has('featured'),
    )
    const first = body.items.at(0)
    if (!first) throw new Error('Catálogo padrão sem itens')

    await catalog.card(first.name).focus()
    await page.keyboard.press('Enter')

    await expect(page).toHaveURL(`/nfts/${first.id}`)
  })

  test('edição e quantidade operáveis só pelo teclado no detalhe', async ({ page, mock }) => {
    const detail = new NftDetailPage(page)
    await mock.open(NftDetailPage.path(testData.nfts.available.id))
    // Abre com a edição de maior tiragem limitada marcada ("1/50", Figma).
    await expect(detail.edition('Padrão')).toBeChecked()

    // Setas movem a seleção no radiogroup (padrão ARIA): o radio focado fica marcado.
    await detail.edition('Padrão').focus()
    await page.keyboard.press('ArrowDown')
    // O Radix move o foco no tick seguinte: espera sair de "Padrão" antes de conferir.
    await expect(detail.edition('Padrão')).not.toBeFocused()
    await expect(detail.editions.locator(':focus')).toBeChecked()

    await detail.increaseQuantity.focus()
    await page.keyboard.press('Enter')
    await expect(detail.quantity).toHaveValue('2')
  })

  test('drawer de filtros prende o foco e devolve ao fechar com Escape', async ({ page, mock }) => {
    test.skip(!test.info().project.use.isMobile, 'Drawer de filtros só abaixo de 1024 px')
    await mock.open('/')
    const toggle = page.getByRole('button', { name: 'Filtros' })
    const drawer = page.getByRole('dialog', { name: 'Filtros' })

    await toggle.focus()
    await page.keyboard.press('Enter')
    await expect(drawer).toBeVisible()
    await expect(drawer.locator(':focus')).toHaveCount(1)

    for (let step = 0; step < 30; step += 1) {
      await page.keyboard.press('Tab')
      await expect(drawer.locator(':focus')).toHaveCount(1)
    }

    await page.keyboard.press('Escape')
    await expect(drawer).toBeHidden()
    await expect(toggle).toBeFocused()
  })
})

test.describe('formulários', () => {
  test('login enviado pelo Enter foca e descreve o primeiro erro', async ({ page, mock }) => {
    const login = new LoginPage(page)
    await mock.open(LoginPage.path)

    await login.email.focus()
    await page.keyboard.press('Enter')

    await expect(login.email).toBeFocused()
    await expect(login.email).toHaveAttribute('aria-invalid', 'true')
    await expect(login.email).toHaveAccessibleDescription(/.+/)
  })

  test('todo campo do login tem rótulo acessível', async ({ page, mock }) => {
    await mock.open(LoginPage.path)
    // No desktop o login é um modal sobre a home (Figma); o fundo fica inerte, então só o formulário conta.
    const form = page
      .locator('form')
      .filter({ has: page.getByRole('button', { name: 'Entrar', exact: true }) })

    for (const field of await form.locator('input:not([type="hidden"])').all()) {
      await expect(field).toHaveAccessibleName(/.+/)
    }
  })
})

test.describe('conteúdo', () => {
  for (const path of ['/', NftDetailPage.path(testData.nfts.available.id), '/login']) {
    test(`sem rolagem horizontal em ${path}`, async ({ page, mock }) => {
      await mock.open(path)
      expect(await hasHorizontalOverflow(page)).toBe(false)
    })
  }

  test('sem rolagem horizontal em 768 px e com zoom de 200%', async ({ page, mock }) => {
    await page.setViewportSize({ width: 768, height: 1024 })
    await mock.open('/')
    expect(await hasHorizontalOverflow(page)).toBe(false)

    // Zoom de 200% em 1440 px equivale a 720 px de viewport CSS.
    await page.setViewportSize({ width: 720, height: 450 })
    expect(await hasHorizontalOverflow(page)).toBe(false)
  })

  test('imagens relevantes têm texto alternativo', async ({ page, mock }) => {
    await mock.open(NftDetailPage.path(testData.nfts.available.id))

    const missing = await page
      .locator('main img')
      .evaluateAll((images) =>
        images
          .filter(
            (image) => image.getAttribute('aria-hidden') !== 'true' && image.getAttribute('alt') === null,
          )
          .map((image) => image.getAttribute('src')),
      )
    expect(missing).toEqual([])
  })
})
