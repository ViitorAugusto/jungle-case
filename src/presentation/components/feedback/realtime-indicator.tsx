import { WifiOffIcon } from 'lucide-react'

import { useRealtimeIndicator } from '@presentation/hooks/use-realtime-status'

/**
 * Estado da conexão em tempo real (premissa 20): "Reconectando" ou "Sem conexão".
 * Some quando conectado. Região `status` sempre presente para o anúncio funcionar.
 */
export function RealtimeIndicator() {
  const { status, label } = useRealtimeIndicator()

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed bottom-20 left-4 z-40 md:bottom-4"
    >
      {label ? (
        <p
          data-status={status}
          className="flex items-center gap-2 rounded-full border border-border bg-popover px-3 py-1.5 text-small font-medium text-popover-foreground shadow-field"
        >
          <WifiOffIcon aria-hidden="true" className="size-4 text-amber" />
          {label}
          {status === 'reconnecting' ? '…' : null}
        </p>
      ) : null}
    </div>
  )
}
