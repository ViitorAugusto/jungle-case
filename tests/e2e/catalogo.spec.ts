import { CatalogPage } from '../support/pages/catalog-page.ts'
import { expect, test } from '../support/test.ts'

/**
 * T01 — busca, filtros combinados, ordenação, paginação e restauração pelo
 * histórico (R02, R13, R14, R15, R42). As asserções comparam a tela com a
 * resposta da API simulada, para não depender dos nomes das fixtures.
 */

const expectCardsToMatch = async (catalog: CatalogPage, names: string[]) => {
  await expect(catalog.cardTitles).toHaveText(names)
}

test.describe('catálogo', () => {
  test('busca pelo Enter reflete na URL, na consulta e nos cards', async ({ page, mock }) => {
    const catalog = new CatalogPage(page)
    await catalog.open(mock, '/')

    const { url, body } = await catalog.listAfter(() => catalog.searchFor('nomad'))

    expect(url.searchParams.get('search')).toBe('nomad')
    await expect(page).toHaveURL(/[?&]q=nomad/)
    await expect(catalog.resultCount).toHaveText(`${body.total} resultados`)
    await expectCardsToMatch(
      catalog,
      body.items.map((item) => item.name),
    )
  })

  test('filtros combinados vão juntos na consulta e na URL', async ({ page, mock }) => {
    const catalog = new CatalogPage(page)
    await catalog.open(mock, '/')
    await catalog.openFilters()

    await catalog.listAfter(() => catalog.collection('Arte digital').check())
    const { url, body } = await catalog.listAfter(() => catalog.network('Ethereum').check())
    await catalog.closeFilters()

    expect(url.searchParams.getAll('collection')).toHaveLength(1)
    expect(url.searchParams.getAll('network')).toEqual(['ethereum'])
    await expect(page).toHaveURL(/collection=/)
    await expect(page).toHaveURL(/network=ethereum/)
    await expectCardsToMatch(
      catalog,
      body.items.map((item) => item.name),
    )
  })

  test('faixa de preço só aplica no botão Aplicar', async ({ page, mock }) => {
    const catalog = new CatalogPage(page)
    await catalog.open(mock, '/')
    await catalog.openFilters()

    await catalog.minPrice.focus()
    await page.keyboard.press('ArrowRight')
    await expect(page).not.toHaveURL(/[?&]min=/)

    const { url } = await catalog.listAfter(() => catalog.applyPrice.click())

    expect(url.searchParams.get('minPrice')).not.toBeNull()
    await expect(page).toHaveURL(/[?&]min=/)
  })

  test('ordenação muda a ordem dos cards conforme a API', async ({ page, mock }) => {
    const catalog = new CatalogPage(page)
    await catalog.open(mock, '/')

    const { url, body } = await catalog.listAfter(() => catalog.sortBy('Menor preço'))

    expect(url.searchParams.get('sort')).toBe('price-asc')
    await expect(page).toHaveURL(/[?&]sort=price-asc/)
    await expectCardsToMatch(
      catalog,
      body.items.map((item) => item.name),
    )
  })

  test('abas do catálogo viram o parâmetro tab', async ({ page, mock }) => {
    const catalog = new CatalogPage(page)
    await catalog.open(mock, '/')

    await catalog.listAfter(() => catalog.tab('Em alta').click())

    await expect(page).toHaveURL(/[?&]tab=em-alta/)
    await expect(catalog.tab('Em alta')).toHaveAttribute('aria-selected', 'true')
  })

  test('paginação avança, marca a página atual e mantém os filtros', async ({ page, mock }) => {
    const catalog = new CatalogPage(page)
    await catalog.open(mock, '/?sort=name-asc')

    const { url, body } = await catalog.listAfter(() => catalog.nextPage.click())

    expect(url.searchParams.get('page')).toBe('2')
    expect(url.searchParams.get('sort')).toBe('name-asc')
    await expect(page).toHaveURL(/[?&]page=2/)
    await expect(catalog.pageLink(2)).toHaveAttribute('aria-current', 'page')
    await expectCardsToMatch(
      catalog,
      body.items.map((item) => item.name),
    )
  })

  test('mudar filtro volta para a página 1', async ({ page, mock }) => {
    const catalog = new CatalogPage(page)
    await catalog.open(mock, '/?page=3')
    await catalog.openFilters()

    const { url } = await catalog.listAfter(() => catalog.network('Polygon').check())

    expect(url.searchParams.get('page') ?? '1').toBe('1')
    await expect(page).not.toHaveURL(/[?&]page=/)
  })

  test('refresh e acesso direto restauram busca, filtros, ordenação e página', async ({ page, mock }) => {
    const catalog = new CatalogPage(page)
    await catalog.open(mock, '/?q=nomad&network=ethereum&sort=price-desc')
    const restored = '/?q=nomad&network=ethereum&sort=price-desc'

    await page.reload()

    await expect(page).toHaveURL(restored)
    await catalog.revealSearch()
    await expect(catalog.search).toHaveValue('nomad')
    await catalog.revealSort()
    await expect(catalog.sort).toHaveValue('price-desc')
    await catalog.openFilters()
    await expect(catalog.network('Ethereum')).toBeChecked()
  })

  test('voltar e avançar no histórico restauram o estado anterior', async ({ page, mock }) => {
    const catalog = new CatalogPage(page)
    await catalog.open(mock, '/')
    const first = await catalog.listAfter(() => catalog.searchFor('nomad'))
    await catalog.listAfter(() => catalog.sortBy('Maior preço'))

    await page.goBack()

    await expect(page).toHaveURL(/[?&]q=nomad/)
    await expect(page).not.toHaveURL(/sort=/)
    await expectCardsToMatch(
      catalog,
      first.body.items.map((item) => item.name),
    )
    await catalog.revealSort()
    await expect(catalog.sort).toHaveValue('recent')
    await catalog.closeFilters()

    await page.goForward()
    await expect(page).toHaveURL(/[?&]sort=price-desc/)
  })

  test('card leva ao detalhe do NFT', async ({ page, mock }) => {
    const catalog = new CatalogPage(page)
    const { body } = await catalog.open(mock)
    const first = body.items.at(0)
    if (!first) throw new Error('Catálogo padrão sem itens')

    await catalog.card(first.name).click()

    await expect(page).toHaveURL(`/nfts/${first.id}`)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(first.name)
  })

  test('catálogo vazio mostra o estado vazio e limpar filtros', async ({ page, mock }) => {
    const catalog = new CatalogPage(page)
    await catalog.open(mock, '/?q=nomad', { scenario: 'empty' })

    await expect(catalog.emptyState).toBeVisible()
    await expect(catalog.clearFilters).toBeVisible()

    await catalog.clearFilters.click()
    await expect(page).not.toHaveURL(/[?&]q=/)
  })

  test('falha da consulta mostra erro e recupera em nova tentativa', async ({ page, mock }) => {
    const catalog = new CatalogPage(page)
    await catalog.open(mock, '/', { scenario: 'server-error' })

    await expect(catalog.errorAlert).toBeVisible()
    await mock.setScenario({ scenario: 'success' })

    const { body } = await catalog.listAfter(() => catalog.retry.click())

    await expect(catalog.errorAlert).toBeHidden()
    await expectCardsToMatch(
      catalog,
      body.items.map((item) => item.name),
    )
  })

  test('resposta antiga que chega depois não sobrescreve a busca atual', async ({ page, mock }) => {
    const catalog = new CatalogPage(page)
    await catalog.open(mock, '/', { scenario: 'out-of-order' })

    const searchIs = (text: string) => (url: URL) => url.searchParams.get('search') === text
    const staleRequest = page.waitForRequest((request) => searchIs('nomad')(new URL(request.url())))
    await catalog.searchFor('nomad')
    const latest = await catalog.listAfter(() => catalog.searchFor('golden'), searchIs('golden'))
    // A busca anterior (lenta) é cancelada ou, se a resposta chegar, descartada (R42).
    await (await staleRequest).response()

    await expect(page).toHaveURL(/[?&]q=golden/)
    await expectCardsToMatch(
      catalog,
      latest.body.items.map((item) => item.name),
    )
  })
})
