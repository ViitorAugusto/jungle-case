import type { WalletSlot } from '@domain/entities/wallet'

import type { WalletGateway } from '@application/ports/gateways/wallet.gateway'
import type { SessionState } from '@application/services/session-state'
import { requireSession } from '@application/services/require-session'

export class RemoveWalletUseCase {
  private readonly wallets: WalletGateway
  private readonly session: SessionState

  constructor(wallets: WalletGateway, session: SessionState) {
    this.wallets = wallets
    this.session = session
  }

  async execute(slot: WalletSlot): Promise<void> {
    requireSession(this.session)
    await this.wallets.remove(slot)
  }
}
