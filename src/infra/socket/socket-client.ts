import type { Socket } from 'socket.io-client'

import { env } from '@infra/config/env'
import { networkReady } from '@infra/network/network-gate'

export type CreateSocket = (query: Record<string, string>) => Socket

/**
 * Carrega o `socket.io-client` sob demanda e devolve a fábrica de conexões.
 *
 * O import é dinâmico e só acontece depois de a rede ser liberada
 * (`network-gate.ts`), por dois motivos: o cliente fica fora do bundle inicial,
 * e o `engine.io-client` só lê `globalThis.WebSocket` depois que o MSW já o
 * substituiu (ele guarda a referência ao construtor quando o módulo é avaliado).
 *
 * Somente WebSocket (sem long-polling), pois é o transporte interceptado pelo
 * MSW. `autoConnect: false` deixa o ciclo de vida com o composition root. A
 * sessão vai na query do handshake (o binding do MSW não lê o pacote `auth`) e
 * `forceNew` garante um Manager novo por sessão, sem reaproveitar a query anterior.
 */
export const loadSocketClient = async (): Promise<CreateSocket> => {
  await networkReady()
  const { io } = await import('socket.io-client')
  return (query) =>
    io(env.socketUrl, {
      autoConnect: false,
      forceNew: true,
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1_000,
      reconnectionDelayMax: 5_000,
      query,
    })
}
