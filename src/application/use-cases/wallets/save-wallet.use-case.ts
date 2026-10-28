import { validateWalletDraft, type Wallet } from '@domain/entities/wallet'

import type { WalletInput } from '@application/dtos/inputs'
import { validationFailed } from '@application/errors/validation'
import type { WalletGateway } from '@application/ports/gateways/wallet.gateway'
import { requireSession } from '@application/services/require-session'
import type { SessionState } from '@application/services/session-state'

/** Cadastra ou edita a carteira principal ou secundária (mesmos campos do pagamento). */
export class SaveWalletUseCase {
  private readonly wallets: WalletGateway
  private readonly session: SessionState

  constructor(wallets: WalletGateway, session: SessionState) {
    this.wallets = wallets
    this.session = session
  }

  execute(input: WalletInput): Promise<Wallet> {
    requireSession(this.session)
    const { slot, ...draft } = input
    const result = validateWalletDraft(draft)
    if (!result.valid) return Promise.reject(validationFailed(result.fieldErrors))
    return this.wallets.save(slot, result.draft)
  }
}
