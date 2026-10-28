import type { Locator, Page, Response } from '@playwright/test'

import type { MockControl, MockOptions } from '../mock-control.ts'

export type CatalogSortLabel = 'Listados recentemente' | 'Menor preço' | 'Maior preço' | 'Nome (A–Z)'
export type CatalogTabLabel = 'Todos os NFTs' | 'Novos lançamentos' | 'Em alta'
export type NetworkLabel = 'Ethereum' | 'Polygon' | 'Solana'

/** Página da listagem como a API simulada devolve (`GET /api/nfts`). */
export type CatalogPageBody = {
  items: { id: string; name: string }[]
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export type CatalogListResult = { url: URL; body: CatalogPageBody }

const isCatalogList = (response: Response) =>
  response.request().method() === 'GET' && /\/api\/nfts\/?(\?|$)/.test(new URL(response.url()).pathname)

/**
 * Catálogo da tela Início. Localizadores por papel e nome acessível; abaixo
 * de 1024 px os filtros ficam num drawer aberto pelo botão "Filtros".
 */
export class CatalogPage {
  private readonly page: Page

  readonly search: Locator
  readonly openSearch: Locator
  readonly sort: Locator
  readonly results: Locator
  readonly cardTitles: Locator
  readonly resultCount: Locator
  readonly pagination: Locator
  readonly nextPage: Locator
  readonly previousPage: Locator
  readonly emptyState: Locator
  readonly clearFilters: Locator
  readonly errorAlert: Locator
  readonly retry: Locator
  readonly minPrice: Locator
  readonly maxPrice: Locator
  readonly applyPrice: Locator
  readonly filtersToggle: Locator

  constructor(page: Page) {
    this.page = page
    this.search = page.getByRole('searchbox', { name: 'Buscar NFTs' })
    this.openSearch = page.getByRole('button', { name: 'Abrir busca' })
    this.sort = page.getByRole('combobox', { name: 'Ordenar por' })
    this.results = page.getByRole('list', { name: 'NFTs' })
    this.cardTitles = this.results.getByRole('heading')
    this.resultCount = page.getByRole('status').filter({ hasText: /resultados?$/ })
    this.pagination = page.getByRole('navigation', { name: 'Paginação' })
    this.nextPage = this.pagination.getByRole('link', { name: 'Próxima página' })
    this.previousPage = this.pagination.getByRole('link', { name: 'Página anterior' })
    this.emptyState = page.getByRole('heading', { name: 'Nenhum NFT encontrado' })
    this.clearFilters = page.getByRole('button', { name: 'Limpar filtros' })
    this.errorAlert = page.getByRole('alert').filter({ hasText: 'carregar os NFTs' })
    this.retry = this.errorAlert.getByRole('button', { name: 'Tentar novamente' })
    this.minPrice = page.getByRole('slider', { name: 'Preço mínimo' })
    this.maxPrice = page.getByRole('slider', { name: 'Preço máximo' })
    this.applyPrice = page.getByRole('button', { name: 'Aplicar' })
    this.filtersToggle = page.getByRole('button', { name: 'Filtros' })
  }

  card(name: string): Locator {
    return this.results.getByRole('link', { name })
  }

  tab(label: CatalogTabLabel): Locator {
    return this.page.getByRole('tab', { name: label })
  }

  pageLink(number: number): Locator {
    return this.pagination.getByRole('link', { name: `Página ${number}`, exact: true })
  }

  collection(label: string): Locator {
    return this.page.getByRole('group', { name: 'Coleções' }).getByRole('checkbox', { name: label })
  }

  network(label: NetworkLabel): Locator {
    return this.page.getByRole('group', { name: 'Rede' }).getByRole('checkbox', { name: label })
  }

  /**
   * Espera a próxima resposta da listagem. `match` filtra pela URL da
   * consulta quando há mais de uma requisição em voo.
   */
  async waitForList(match: (url: URL) => boolean = () => true): Promise<CatalogListResult> {
    const response = await this.page.waitForResponse((candidate) => {
      if (!isCatalogList(candidate)) return false
      const url = new URL(candidate.url())
      return !url.searchParams.has('featured') && match(url)
    })
    return { url: new URL(response.url()), body: (await response.json()) as CatalogPageBody }
  }

  /**
   * Abre a tela já esperando a primeira listagem (a busca de destaques é
   * ignorada), para que a próxima ação não capture a resposta da carga inicial.
   */
  async open(mock: MockControl, path = '/', options: MockOptions = {}): Promise<CatalogListResult> {
    return this.listAfter(() => mock.open(path, options))
  }

  /** Executa `action` e devolve a resposta da listagem que ela disparou. */
  async listAfter(action: () => Promise<unknown>, match?: (url: URL) => boolean): Promise<CatalogListResult> {
    const [result] = await Promise.all([this.waitForList(match), action()])
    return result
  }

  /** No desktop a busca fica atrás do botão de lupa do cabeçalho. */
  async revealSearch(): Promise<void> {
    await this.search.or(this.openSearch).first().waitFor()
    if (!(await this.search.isVisible())) await this.openSearch.click()
  }

  async searchFor(text: string): Promise<void> {
    await this.revealSearch()
    await this.search.fill(text)
    await this.search.press('Enter')
  }

  /** `<select>` nativo: escolhe a opção pelo rótulo (abre o drawer quando preciso). */
  async sortBy(label: CatalogSortLabel): Promise<void> {
    await this.revealSort()
    await this.sort.selectOption({ label })
    await this.closeFilters()
  }

  /** Abaixo de 1024 px a ordenação fica dentro do drawer de filtros. */
  async revealSort(): Promise<void> {
    await this.sort.or(this.filtersToggle).first().waitFor()
    if (!(await this.sort.isVisible())) await this.openFilters()
  }

  /** Abaixo de 1024 px abre o drawer; acima, os filtros já estão visíveis. */
  async openFilters(): Promise<void> {
    if (await this.filtersToggle.isVisible()) await this.filtersToggle.click()
  }

  async closeFilters(): Promise<void> {
    if (await this.page.getByRole('dialog', { name: 'Filtros' }).isVisible())
      await this.page.keyboard.press('Escape')
  }
}
