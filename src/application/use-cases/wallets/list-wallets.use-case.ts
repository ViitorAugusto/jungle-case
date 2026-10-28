import type { Wallet } from '@domain/entities/wallet'

import type { RequestOptions } from '@application/ports/gateways/catalog.gateway'
import type { WalletGateway } from '@application/ports/gateways/wallet.gateway'
import type { SessionState } from '@application/services/session-state'
import { requireSession } from '@application/services/require-session'

export class ListWalletsUseCase {
  private readonly wallets: WalletGateway
  private readonly session: SessionState

  constructor(wallets: WalletGateway, session: SessionState) {
    this.wallets = wallets
    this.session = session
  }

  execute(options?: RequestOptions): Promise<readonly Wallet[]> {
    requireSession(this.session)
    return this.wallets.list(options)
  }
}
