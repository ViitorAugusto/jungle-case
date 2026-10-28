import type { Nft } from '@domain/entities/nft'
import type { Order } from '@domain/entities/order'

/** Destino das mudanças recebidas em tempo real (ex.: cache da camada de estado). */
export interface RealtimeSink {
  applyNft(nft: Nft): void
  applyOrder(order: Order): void
  /** Recarrega por REST tudo que pode ter mudado durante a desconexão. */
  reconcile(): void
}
