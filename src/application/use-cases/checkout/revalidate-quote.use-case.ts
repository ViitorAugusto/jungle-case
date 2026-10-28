import { diffQuotes, type Quote, type QuoteChange } from '@domain/entities/quote'

import type { QuoteGateway } from '@application/ports/gateways/quote.gateway'
import type { SessionState } from '@application/services/session-state'
import { requireSession } from '@application/services/require-session'

export type RevalidateQuoteOutput = {
  /** Cotação vigente; é ela que segue para o pedido. */
  readonly quote: Quote
  readonly changes: readonly QuoteChange[]
  /** Verdadeiro quando o usuário precisa revisar e confirmar de novo antes de pagar. */
  readonly requiresConfirmation: boolean
}

/**
 * Revalida preço, disponibilidade, cupom e taxas imediatamente antes do envio.
 * Qualquer diferença em relação à cotação revisada bloqueia o envio até nova
 * confirmação. Cotação vencida sem diferença de valores segue com a nova.
 */
export class RevalidateQuoteUseCase {
  private readonly quotes: QuoteGateway
  private readonly session: SessionState

  constructor(quotes: QuoteGateway, session: SessionState) {
    this.quotes = quotes
    this.session = session
  }

  async execute(reviewed: Quote): Promise<RevalidateQuoteOutput> {
    requireSession(this.session)
    const fresh = await this.quotes.create()
    const changes = diffQuotes(reviewed, fresh)
    return { quote: fresh, changes, requiresConfirmation: changes.length > 0 }
  }
}
