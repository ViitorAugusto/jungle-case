import type { Socket } from 'socket.io-client'

import type {
  RealtimeConnection,
  RealtimeGateway,
  RealtimeListeners,
} from '@application/ports/gateways/realtime.gateway'

import { toNftUpdatedEvent, toOrderUpdatedEvent } from '@adapters/mappers/api.mapper'
import { realtimeEvents, SOCKET_TOKEN_QUERY } from '@adapters/socket/contracts'

export type SocketFactory = (query: Record<string, string>) => Socket

/** Entrega a fábrica de sockets; é assíncrono para o cliente Socket.IO ser carregado sob demanda. */
export type SocketFactoryLoader = () => Promise<SocketFactory>

/** Falhas seguidas de conexão até o status virar `disconnected` (as tentativas continuam). */
export const FAILED_ATTEMPTS_BEFORE_OFFLINE = 3

/**
 * Gateway de tempo real sobre `socket.io-client`. Uma conexão por sessão,
 * autenticada pelo token no handshake. `close()` remove todos os listeners
 * antes de desconectar, e um evento que ainda chegue depois é ignorado. Se a
 * conexão for fechada antes de o cliente terminar de carregar, nada é aberto.
 */
export class SocketIoRealtimeGateway implements RealtimeGateway {
  private readonly loadSocketFactory: SocketFactoryLoader

  constructor(loadSocketFactory: SocketFactoryLoader) {
    this.loadSocketFactory = loadSocketFactory
  }

  connect(accessToken: string | null, listeners: RealtimeListeners): RealtimeConnection {
    let socket: Socket | null = null
    let closed = false
    const isClosed = () => closed

    listeners.onStatusChange('connecting')
    this.loadSocketFactory().then(
      (createSocket) => {
        if (closed) return
        socket = createSocket(accessToken ? { [SOCKET_TOKEN_QUERY]: accessToken } : {})
        this.listen(socket, listeners, isClosed)
        socket.connect()
      },
      () => {
        if (!closed) listeners.onStatusChange('disconnected')
      },
    )

    return {
      close: () => {
        if (closed) return
        closed = true
        socket?.removeAllListeners()
        socket?.disconnect()
      },
    }
  }

  private listen(socket: Socket, listeners: RealtimeListeners, isClosed: () => boolean): void {
    let connectedBefore = false
    let failedAttempts = 0

    socket.on('connect', () => {
      if (isClosed()) return
      failedAttempts = 0
      listeners.onStatusChange('connected')
      if (connectedBefore) listeners.onReconnected()
      connectedBefore = true
    })
    socket.on('disconnect', (reason) => {
      if (isClosed()) return
      if (reason === 'io server disconnect') {
        // O servidor encerrou a sessão do socket: o Socket.IO não reconecta sozinho.
        listeners.onStatusChange('reconnecting')
        socket.connect()
        return
      }
      listeners.onStatusChange(reason === 'io client disconnect' ? 'disconnected' : 'reconnecting')
    })
    // Primeiras falhas = "Reconectando"; a partir da terceira seguida = "Sem conexão".
    socket.on('connect_error', () => {
      if (isClosed()) return
      failedAttempts += 1
      listeners.onStatusChange(
        failedAttempts >= FAILED_ATTEMPTS_BEFORE_OFFLINE ? 'disconnected' : 'reconnecting',
      )
    })
    socket.on(realtimeEvents.nftUpdated, (raw: unknown) => {
      const event = isClosed() ? null : toNftUpdatedEvent(raw)
      if (event) listeners.onNftUpdated(event)
    })
    socket.on(realtimeEvents.orderUpdated, (raw: unknown) => {
      const event = isClosed() ? null : toOrderUpdatedEvent(raw)
      if (event) listeners.onOrderUpdated(event)
    })
  }
}
