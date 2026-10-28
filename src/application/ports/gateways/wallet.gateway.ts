import type { ValidWalletDraft, Wallet, WalletProvider, WalletSlot } from '@domain/entities/wallet'

import type { RequestOptions } from '@application/ports/gateways/catalog.gateway'

export interface WalletGateway {
  list(options?: RequestOptions): Promise<readonly Wallet[]>
  save(slot: WalletSlot, input: ValidWalletDraft): Promise<Wallet>
  remove(slot: WalletSlot): Promise<void>
  /** Conexão simulada: a simulação pode recusar (CONFLICT, reason WALLET_REJECTED). */
  connect(slot: WalletSlot, provider: WalletProvider): Promise<Wallet>
  disconnect(slot: WalletSlot): Promise<Wallet>
}
