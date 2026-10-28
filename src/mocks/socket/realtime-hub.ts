import type { NftDto, OrderDto } from '@adapters/http/contracts'
import {
  realtimeEvents,
  type NftUpdatedEventDto,
  type OrderUpdatedEventDto,
} from '@adapters/socket/contracts'

import { db } from '@mocks/db/database'

type Connection = {
  readonly id: number
  /** Dono da conexão; `null` = visitante (só eventos públicos). */
  readonly userId: string | null
  readonly emit: (event: string, payload: unknown) => void
  readonly close: () => void
}

type SentEvent = {
  readonly name: string
  readonly payload: NftUpdatedEventDto | OrderUpdatedEventDto
  readonly userId: string | null
}

let nextConnectionId = 0
const connections = new Map<number, Connection>()
let lastEvent: SentEvent | null = null

const send = (event: SentEvent) => {
  lastEvent = event
  for (const connection of connections.values()) {
    // Evento privado só para conexões do dono; evento público para todas.
    if (event.userId === null || connection.userId === event.userId)
      connection.emit(event.name, event.payload)
  }
}

/**
 * Conexões Socket.IO simuladas e emissão de eventos. Todo evento nasce de uma
 * mudança no estado simulado (a mesma que a API REST passa a devolver).
 */
export const realtimeHub = {
  add(userId: string | null, emit: Connection['emit'], close: Connection['close']): number {
    nextConnectionId += 1
    connections.set(nextConnectionId, { id: nextConnectionId, userId, emit, close })
    return nextConnectionId
  },

  remove(id: number): void {
    connections.delete(id)
  },

  /** Fecha todas as conexões (o cliente reconecta sozinho). */
  disconnectAll(): void {
    for (const connection of [...connections.values()]) connection.close()
    connections.clear()
  },

  nftUpdated(nft: NftDto): void {
    const payload: NftUpdatedEventDto = {
      eventId: db.nextId('event', 'evt'),
      type: realtimeEvents.nftUpdated,
      resource: { type: 'nft', id: nft.id },
      version: nft.version,
      occurredAt: new Date().toISOString(),
      payload: nft,
    }
    send({ name: realtimeEvents.nftUpdated, payload, userId: null })
  },

  orderUpdated(userId: string, order: OrderDto): void {
    const payload: OrderUpdatedEventDto = {
      eventId: db.nextId('event', 'evt'),
      type: realtimeEvents.orderUpdated,
      resource: { type: 'order', id: order.id },
      version: order.version,
      occurredAt: new Date().toISOString(),
      payload: order,
    }
    send({ name: realtimeEvents.orderUpdated, payload, userId })
  },

  /** Reenvia o último evento com o mesmo `eventId` (teste de duplicado). */
  resendLast(): boolean {
    if (!lastEvent) return false
    send(lastEvent)
    return true
  },

  /** Envia um `nft.updated` com versão anterior à atual e preço antigo (teste de evento antigo). */
  sendStale(nft: NftDto, stalePriceEth: string): void {
    const stale: NftDto = {
      ...nft,
      version: Math.max(0, nft.version - 1),
      editions: nft.editions.map((edition, index) =>
        index === 0 ? { ...edition, priceEth: stalePriceEth } : edition,
      ),
    }
    const payload: NftUpdatedEventDto = {
      eventId: db.nextId('event', 'evt'),
      type: realtimeEvents.nftUpdated,
      resource: { type: 'nft', id: nft.id },
      version: stale.version,
      occurredAt: new Date().toISOString(),
      payload: stale,
    }
    lastEvent = { name: realtimeEvents.nftUpdated, payload, userId: null }
    for (const connection of connections.values()) connection.emit(realtimeEvents.nftUpdated, payload)
  },

  lastEventId(): string | null {
    return lastEvent?.payload.eventId ?? null
  },

  connectionCount(): number {
    return connections.size
  },
}
