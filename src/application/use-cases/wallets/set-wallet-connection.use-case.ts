import { isWalletProvider, type Wallet } from '@domain/entities/wallet'

import type { SetWalletConnectionInput } from '@application/dtos/inputs'
import { validationFailed } from '@application/errors/validation'

import type { WalletGateway } from '@application/ports/gateways/wallet.gateway'
import type { SessionState } from '@application/services/session-state'
import { requireSession } from '@application/services/require-session'

/**
 * Conecta a carteira por um provedor (MetaMask, WalletConnect, Coinbase) ou a
 * desconecta, na simulação. A conexão pode ser recusada (`WALLET_REJECTED`).
 */
export class SetWalletConnectionUseCase {
  private readonly wallets: WalletGateway
  private readonly session: SessionState

  constructor(wallets: WalletGateway, session: SessionState) {
    this.wallets = wallets
    this.session = session
  }

  execute(input: SetWalletConnectionInput): Promise<Wallet> {
    requireSession(this.session)
    if (!input.connected) return this.wallets.disconnect(input.slot)
    if (!isWalletProvider(input.provider)) {
      return Promise.reject(validationFailed({ provider: ['Escolha MetaMask, WalletConnect ou Coinbase'] }))
    }
    return this.wallets.connect(input.slot, input.provider)
  }
}
