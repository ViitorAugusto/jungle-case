import type { NftDto, OrderDto } from '@adapters/http/contracts'

/**
 * Contrato dos eventos Socket.IO (servidor → cliente). Documentação:
 * ARCHITECTURE.md, seção "Contratos de eventos".
 */
export const realtimeEvents = {
  nftUpdated: 'nft.updated',
  orderUpdated: 'order.updated',
} as const

type EnvelopeDto<TType extends string, TResource extends string, TPayload> = {
  readonly eventId: string
  readonly type: TType
  readonly resource: { readonly type: TResource; readonly id: string }
  readonly version: number
  readonly occurredAt: string
  readonly payload: TPayload
}

export type NftUpdatedEventDto = EnvelopeDto<'nft.updated', 'nft', NftDto>
export type OrderUpdatedEventDto = EnvelopeDto<'order.updated', 'order', OrderDto>

/** Parâmetro de query do handshake que identifica a sessão (ausente = visitante). */
export const SOCKET_TOKEN_QUERY = 'token'
