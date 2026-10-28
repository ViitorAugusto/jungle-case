import { expect, type Locator, type Page } from '@playwright/test'

import type { PriceSummaryBody } from '../api.ts'

/**
 * Tela do carrinho (`/carrinho`). Uma linha por NFT + edição. Textos do Figma
 * (premissa 17); no mobile o resumo vira painel fixo no rodapé, com os mesmos nomes.
 */
export class CartPage {
  static readonly path = '/carrinho'

  readonly lines: Locator
  readonly emptyState: Locator
  readonly couponField: Locator
  readonly applyCoupon: Locator
  readonly removeCoupon: Locator
  readonly summary: Locator
  readonly checkout: Locator
  readonly changeNotice: Locator

  constructor(page: Page) {
    this.lines = page.getByRole('list', { name: 'Itens do carrinho' }).getByRole('listitem')
    this.emptyState = page.getByRole('heading', { name: 'Seu carrinho está vazio' })
    this.couponField = page.getByRole('textbox', { name: 'Código promocional' })
    this.applyCoupon = page.getByRole('button', { name: 'Aplicar', exact: true })
    this.removeCoupon = page.getByRole('button', { name: 'Remover cupom' })
    this.summary = page.getByRole('region', { name: 'Resumo da carteira' })
    this.checkout = page.getByRole('link', { name: 'Conectar e finalizar' })
    this.changeNotice = page.getByRole('status').filter({ hasText: /preço|disponibilidade/i })
  }

  line(nftName: string): CartLine {
    return new CartLine(this.lines.filter({ hasText: nftName }))
  }

  async useCoupon(code: string): Promise<void> {
    await this.couponField.fill(code)
    await this.applyCoupon.click()
  }

  /**
   * O resumo mostra exatamente os valores da cotação da API (R21, R23): cada
   * rótulo é seguido do seu valor sem arredondamento, mais " ETH" (premissa 16).
   */
  async expectSummary(summary: PriceSummaryBody): Promise<void> {
    await expectSummaryIn(this.summary, summary)
  }
}

const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/** Rótulo do Figma e o texto que antecede o valor (o desconto vem como "(-) 0.1 ETH"). */
const SUMMARY_ROWS = [
  { label: 'Subtotal', prefix: '', pick: (summary: PriceSummaryBody) => summary.subtotalEth },
  {
    label: 'Desconto do lançamento',
    prefix: '(-)',
    pick: (summary: PriceSummaryBody) => summary.discountEth,
  },
  { label: 'Taxa de rede', prefix: '', pick: (summary: PriceSummaryBody) => summary.networkFeeEth },
  { label: 'Total', prefix: '', pick: (summary: PriceSummaryBody) => summary.totalEth },
] as const

type SummaryLabel = (typeof SUMMARY_ROWS)[number]['label']

/** O recibo do Figma só mostra "Taxa de rede" e "Total". */
export const RECEIPT_SUMMARY_LABELS: readonly SummaryLabel[] = ['Taxa de rede', 'Total']

export const expectSummaryIn = async (
  region: Locator,
  summary: PriceSummaryBody,
  labels: readonly SummaryLabel[] = SUMMARY_ROWS.map((row) => row.label),
): Promise<void> => {
  for (const { label, prefix, pick } of SUMMARY_ROWS.filter((row) => labels.includes(row.label))) {
    const value = pick(summary)
    // Sem desconto o Figma mostra um zero formatado; só conferimos o desconto quando há.
    if (prefix && value === '0') continue
    const pattern = `${label}\\s*${escapeRegExp(prefix)}\\s*${escapeRegExp(value)} ETH`
    await expect(region).toContainText(new RegExp(pattern))
  }
}

export class CartLine {
  readonly root: Locator
  readonly quantity: Locator
  readonly increase: Locator
  readonly decrease: Locator
  readonly remove: Locator

  constructor(root: Locator) {
    this.root = root
    this.quantity = root.getByRole('spinbutton', { name: 'Quantidade' })
    this.increase = root.getByRole('button', { name: 'Aumentar quantidade' })
    this.decrease = root.getByRole('button', { name: 'Diminuir quantidade' })
    this.remove = root.getByRole('button', { name: /^Remover/ })
  }
}
