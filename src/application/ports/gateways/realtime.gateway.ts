import type { NftUpdatedEvent, OrderUpdatedEvent } from '@domain/entities/realtime-event'

export type RealtimeStatus = 'idle' | 'connecting' | 'connected' | 'reconnecting' | 'disconnected'

export type RealtimeListeners = {
  readonly onNftUpdated: (event: NftUpdatedEvent) => void
  readonly onOrderUpdated: (event: OrderUpdatedEvent) => void
  readonly onStatusChange: (status: RealtimeStatus) => void
  /** Conexão restabelecida depois de uma queda: hora de reconciliar por REST. */
  readonly onReconnected: () => void
}

export interface RealtimeConnection {
  /** Desconecta e remove todos os listeners. Eventos que chegarem depois são descartados. */
  close(): void
}

export interface RealtimeGateway {
  /** Abre uma conexão por sessão; `accessToken` nulo = visitante (só eventos públicos). */
  connect(accessToken: string | null, listeners: RealtimeListeners): RealtimeConnection
}
