import type {
  RealtimeConnection,
  RealtimeGateway,
  RealtimeStatus,
} from '@application/ports/gateways/realtime.gateway'
import type { RealtimeSink } from '@application/ports/services/realtime-sink'
import { RealtimeEventFilter } from '@application/services/realtime-event-filter'

type StatusListener = (status: RealtimeStatus) => void

/**
 * Ciclo de vida do tempo real por sessão. Cada `start` encerra a conexão
 * anterior (listeners incluídos) e abre uma geração nova com filtro limpo;
 * eventos de gerações antigas são descartados mesmo que cheguem atrasados.
 */
export class RealtimeSync {
  private connection: RealtimeConnection | null = null
  private generation = 0
  private status: RealtimeStatus = 'idle'
  private readonly statusListeners = new Set<StatusListener>()

  private readonly gateway: RealtimeGateway
  private readonly sink: RealtimeSink

  constructor(gateway: RealtimeGateway, sink: RealtimeSink) {
    this.gateway = gateway
    this.sink = sink
  }

  start(accessToken: string | null): void {
    this.stop()
    const generation = this.generation
    const filter = new RealtimeEventFilter()
    const isCurrent = () => generation === this.generation

    this.connection = this.gateway.connect(accessToken, {
      onNftUpdated: (event) => {
        if (isCurrent() && filter.accept(event)) this.sink.applyNft(event.payload)
      },
      onOrderUpdated: (event) => {
        if (isCurrent() && filter.accept(event)) this.sink.applyOrder(event.payload)
      },
      onStatusChange: (status) => {
        if (isCurrent()) this.setStatus(status)
      },
      onReconnected: () => {
        if (isCurrent()) this.sink.reconcile()
      },
    })
  }

  stop(): void {
    this.generation += 1
    this.connection?.close()
    this.connection = null
    this.setStatus('idle')
  }

  getStatus = (): RealtimeStatus => this.status

  subscribe = (listener: StatusListener): (() => void) => {
    this.statusListeners.add(listener)
    return () => this.statusListeners.delete(listener)
  }

  private setStatus(status: RealtimeStatus): void {
    if (status === this.status) return
    this.status = status
    for (const listener of this.statusListeners) listener(status)
  }
}
