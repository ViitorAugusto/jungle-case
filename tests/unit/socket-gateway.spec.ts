import { expect, test } from '@playwright/test'
import type { Socket } from 'socket.io-client'

import type { RealtimeListeners, RealtimeStatus } from '@application/ports/gateways/realtime.gateway'

import { SocketIoRealtimeGateway } from '@adapters/socket/socket-io-realtime.gateway'

type Handler = (...args: unknown[]) => void

/** Socket falso: registra listeners e conta conexões, sem rede. */
class FakeSocket {
  readonly handlers = new Map<string, Handler[]>()
  connects = 0
  disconnected = false

  on(event: string, handler: Handler) {
    this.handlers.set(event, [...(this.handlers.get(event) ?? []), handler])
    return this
  }

  fire(event: string, ...args: unknown[]) {
    for (const handler of this.handlers.get(event) ?? []) handler(...args)
  }

  connect() {
    this.connects += 1
    return this
  }

  disconnect() {
    this.disconnected = true
    return this
  }

  removeAllListeners() {
    this.handlers.clear()
    return this
  }
}

const setup = async () => {
  const socket = new FakeSocket()
  const statuses: RealtimeStatus[] = []
  let reconnected = 0
  const listeners: RealtimeListeners = {
    onNftUpdated: () => undefined,
    onOrderUpdated: () => undefined,
    onStatusChange: (status) => statuses.push(status),
    onReconnected: () => {
      reconnected += 1
    },
  }
  const gateway = new SocketIoRealtimeGateway(() => Promise.resolve(() => socket as unknown as Socket))
  const connection = gateway.connect('token', listeners)
  await Promise.resolve()
  return { socket, statuses, connection, reconnected: () => reconnected }
}

test.describe('SocketIoRealtimeGateway', () => {
  test('três falhas seguidas viram "disconnected"; conectar zera a contagem', async () => {
    const { socket, statuses } = await setup()
    socket.fire('connect_error')
    socket.fire('connect_error')
    expect(statuses.at(-1)).toBe('reconnecting')
    socket.fire('connect_error')
    expect(statuses.at(-1)).toBe('disconnected')
    socket.fire('connect')
    expect(statuses.at(-1)).toBe('connected')
    socket.fire('connect_error')
    expect(statuses.at(-1)).toBe('reconnecting')
  })

  test('reconexão depois de conectar avisa para reconciliar', async () => {
    const { socket, reconnected } = await setup()
    socket.fire('connect')
    socket.fire('disconnect', 'transport close')
    socket.fire('connect')
    expect(reconnected()).toBe(1)
  })

  test('"io server disconnect" pede nova conexão em vez de ficar preso', async () => {
    const { socket, statuses } = await setup()
    const before = socket.connects
    socket.fire('disconnect', 'io server disconnect')
    expect(socket.connects).toBe(before + 1)
    expect(statuses.at(-1)).toBe('reconnecting')
  })

  test('fechar remove listeners e desconecta', async () => {
    const { socket, connection } = await setup()
    connection.close()
    expect(socket.disconnected).toBe(true)
    expect(socket.handlers.size).toBe(0)
  })
})
