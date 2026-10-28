import type { Locator, Page, Response } from '@playwright/test'

export type EditionName = 'Padrão' | 'Rara' | 'Lendária'

/** NFT como a API simulada devolve (`GET /api/nfts/:id`). */
export type NftBody = {
  id: string
  name: string
  images: { url: string; alt: string }[]
  editions: { id: string; name: EditionName; priceEth: string; available: number }[]
}

const isNftDetail = (nftId: string) => (response: Response) =>
  response.request().method() === 'GET' && new URL(response.url()).pathname.endsWith(`/api/nfts/${nftId}`)

/** Tela de detalhe do NFT (`/nfts/$nftId`). */
export class NftDetailPage {
  private readonly page: Page

  readonly title: Locator
  readonly editions: Locator
  readonly quantity: Locator
  readonly increaseQuantity: Locator
  readonly decreaseQuantity: Locator
  readonly addToCart: Locator
  readonly buy: Locator
  readonly favorite: Locator
  readonly notFound: Locator
  readonly backToCatalog: Locator

  constructor(page: Page) {
    this.page = page
    this.title = page.getByRole('heading', { level: 1 })
    this.editions = page.getByRole('radiogroup', { name: 'Edição' })
    this.quantity = page.getByRole('spinbutton', { name: 'Quantidade' })
    this.increaseQuantity = page.getByRole('button', { name: 'Aumentar quantidade' })
    this.decreaseQuantity = page.getByRole('button', { name: 'Diminuir quantidade' })
    this.addToCart = page.getByRole('button', { name: 'Adicionar ao carrinho' })
    this.buy = page.getByRole('button', { name: 'Comprar NFT' })
    this.favorite = page.getByRole('button', { name: 'Favoritar' })
    this.notFound = page.getByRole('heading', { name: 'NFT não encontrado' })
    this.backToCatalog = page.getByRole('link', { name: 'Voltar ao catálogo' })
  }

  static path(nftId: string): string {
    return `/nfts/${nftId}`
  }

  edition(name: EditionName): Locator {
    return this.editions.getByRole('radio', { name })
  }

  thumbnail(position: number, total: number): Locator {
    return this.page.getByRole('button', { name: `Imagem ${position} de ${total}` })
  }

  image(alt: string): Locator {
    return this.page.getByRole('img', { name: alt, exact: true })
  }

  /** Escolhe a edição, ajusta a quantidade pelos botões e adiciona ao carrinho. */
  async addToCartWith(edition: EditionName, quantity = 1): Promise<void> {
    await this.edition(edition).check()
    for (let current = 1; current < quantity; current += 1) await this.increaseQuantity.click()
    await this.addToCart.click()
  }

  /** Executa `action` e devolve o NFT que a API respondeu para a tela. */
  async loadAfter(nftId: string, action: () => Promise<unknown>): Promise<NftBody> {
    const [response] = await Promise.all([this.page.waitForResponse(isNftDetail(nftId)), action()])
    return (await response.json()) as NftBody
  }
}
