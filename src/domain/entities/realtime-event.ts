import type { Nft } from '@domain/entities/nft'
import type { Order } from '@domain/entities/order'

type EventEnvelope<TType extends string, TResource extends string, TPayload> = {
  /** Identidade estável: o mesmo evento reenviado chega com o mesmo `eventId`. */
  readonly eventId: string
  readonly type: TType
  readonly resource: { readonly type: TResource; readonly id: string }
  /** Versão do recurso após a mudança. */
  readonly version: number
  readonly occurredAt: string
  readonly payload: TPayload
}

export type NftUpdatedEvent = EventEnvelope<'nft.updated', 'nft', Nft>
export type OrderUpdatedEvent = EventEnvelope<'order.updated', 'order', Order>
export type RealtimeEvent = NftUpdatedEvent | OrderUpdatedEvent
