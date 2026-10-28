import { useSyncExternalStore } from 'react'

import type { RealtimeStatus } from '@application/dtos'

import { container } from '@main/container'

const { realtime } = container

/**
 * Texto do indicador de conexão (premissa 20, contrato com os testes).
 * `null` = nada a exibir: conectado, ou conectando pela primeira vez.
 */
export const realtimeStatusLabels: Record<RealtimeStatus, string | null> = {
  idle: null,
  connecting: null,
  connected: null,
  reconnecting: 'Reconectando',
  disconnected: 'Sem conexão',
}

/** Estado da conexão em tempo real: `connected`, `reconnecting`, `disconnected`... */
export const useRealtimeStatus = (): RealtimeStatus =>
  useSyncExternalStore(realtime.subscribe, realtime.getStatus)

/** Status e texto prontos para o indicador de conexão. */
export const useRealtimeIndicator = () => {
  const status = useRealtimeStatus()
  return { status, label: realtimeStatusLabels[status] }
}
