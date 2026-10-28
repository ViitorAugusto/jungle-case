import { toSocketIo } from '@mswjs/socket.io-binding'
import { ws, type WebSocketHandler } from 'msw'

import { SOCKET_TOKEN_QUERY } from '@adapters/socket/contracts'

import { scenarios } from '@mocks/scenarios/scenarios'
import { userIdForSocketToken } from '@mocks/services/auth'
import { realtimeHub } from '@mocks/socket/realtime-hub'

/**
 * Servidor Socket.IO simulado. Intercepta o WebSocket aberto pelo
 * `socket.io-client` e expõe a API de eventos do Socket.IO para emitir
 * `nft.updated` e `order.updated`. O MSW remove o prefixo `/socket.io/` da URL
 * do cliente antes de comparar, por isso o padrão casa a raiz de qualquer origem.
 */
export const realtimeLink = ws.link(/^wss?:\/\/[^/]+\/(?:\?.*)?$/)

/** Ping do Engine.IO: sem ele o cliente encerra a conexão após `pingInterval + pingTimeout`. */
const PING_INTERVAL_MS = 20_000
const ENGINE_IO_PING = '2'

export const realtimeHandlers: WebSocketHandler[] = [
  realtimeLink.addEventListener('connection', (connection) => {
    // Queda simulada ou cenário offline: recusa a conexão. Lançar faz o interceptor emitir
    // `error` + close 1011 (como um servidor fora do ar). Um `close()` limpo antes do `open`
    // não dispara `error`, e o Manager do Socket.IO deixaria de agendar novas tentativas.
    if (scenarios.is('offline') || Date.now() < scenarios.socketDownUntil) {
      throw new Error('Servidor de tempo real indisponível (simulação)')
    }

    // Sessão identificada pelo token do handshake; sem token (ou sessão morta) = só eventos públicos.
    const token = connection.client.url.searchParams.get(SOCKET_TOKEN_QUERY)
    const userId = token ? userIdForSocketToken(token) : null

    const io = toSocketIo(connection)
    const id = realtimeHub.add(
      userId,
      (event, payload) => {
        io.client.emit(event, payload)
      },
      () => {
        connection.client.close()
      },
    )
    const ping = setInterval(() => {
      connection.client.send(ENGINE_IO_PING)
    }, PING_INTERVAL_MS)

    connection.client.addEventListener('close', () => {
      clearInterval(ping)
      realtimeHub.remove(id)
    })
  }),
]
