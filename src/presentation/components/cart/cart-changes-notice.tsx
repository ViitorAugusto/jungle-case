import { XIcon } from 'lucide-react'

import type { CartChange } from '@application/dtos'

import { Button } from '@presentation/components/ui/button'

const describe = (change: CartChange): string => {
  switch (change.kind) {
    case 'price':
      return `O preço de ${change.nftName} mudou de ${change.previousEth} ETH para ${change.currentEth} ETH.`
    case 'availability':
      return change.current === 0
        ? `A disponibilidade de ${change.nftName} mudou: esgotou.`
        : `A disponibilidade de ${change.nftName} mudou: ${change.current === 1 ? 'resta 1' : `${change.current} disponíveis`}.`
    case 'removed':
      return `${change.nftName} saiu do carrinho porque não está mais disponível.`
  }
}

/**
 * Avisos de mudança recebidos em tempo real (preço, disponibilidade, item
 * removido). Região `status` sempre presente, para o leitor de tela anunciar.
 */
export function CartChangesNotice({
  changes,
  onDismiss,
  className,
}: {
  readonly changes: readonly CartChange[]
  readonly onDismiss: () => void
  readonly className?: string
}) {
  return (
    <div role="status" aria-live="polite" className={className}>
      {changes.length > 0 ? (
        <div className="flex items-start justify-between gap-3 rounded-sm border border-amber/60 bg-surface-dark px-4 py-3">
          <ul className="flex flex-col gap-1 text-body-sm text-foreground">
            {changes.map((change) => (
              <li key={`${change.kind}-${change.lineId}`}>{describe(change)}</li>
            ))}
          </ul>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Dispensar avisos"
            onClick={onDismiss}
            className="size-7"
          >
            <XIcon aria-hidden="true" className="size-4" />
          </Button>
        </div>
      ) : null}
    </div>
  )
}
