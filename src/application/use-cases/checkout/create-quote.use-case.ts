import type { Quote } from '@domain/entities/quote'

import type { QuoteGateway } from '@application/ports/gateways/quote.gateway'
import type { SessionState } from '@application/services/session-state'
import { requireSession } from '@application/services/require-session'

/** Congela preços, cupom e taxas do carrinho atual para a revisão do pagamento. */
export class CreateQuoteUseCase {
  private readonly quotes: QuoteGateway
  private readonly session: SessionState

  constructor(quotes: QuoteGateway, session: SessionState) {
    this.quotes = quotes
    this.session = session
  }

  execute(): Promise<Quote> {
    requireSession(this.session)
    return this.quotes.create()
  }
}
