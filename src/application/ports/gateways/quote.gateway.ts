import type { Quote } from '@domain/entities/quote'

export interface QuoteGateway {
  /** Cotação nova a partir do carrinho atual, com preços, cupom e taxas vigentes. */
  create(): Promise<Quote>
}
