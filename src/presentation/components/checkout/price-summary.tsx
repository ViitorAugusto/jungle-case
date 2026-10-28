import type { PriceSummary as PriceSummaryData } from '@application/dtos'

import { EthValue } from '@presentation/components/ui/eth-value'
import { Skeleton } from '@presentation/components/ui/skeleton'
import { cn } from '@presentation/lib/utils'

type PriceSummaryProps = {
  readonly summary: PriceSummaryData
  /** Carrinho e pagamento sempre mostram o desconto (Figma: "(-) 00.00"); o recibo, só se houver. */
  readonly discount?: 'always' | 'when-applied'
  /** Recotação em andamento: valores viram skeleton com as mesmas dimensões (R67). */
  readonly loading?: boolean
  readonly className?: string
}

const isZero = (amount: string) => /^0(\.0*)?$/.test(amount)

/**
 * Valores da cotação da API (o cliente não recalcula), exatamente como vieram
 * (premissa 16), com os rótulos do Figma. Cada rótulo vem logo antes do valor.
 */
export function PriceSummary({
  summary,
  discount = 'always',
  loading = false,
  className,
}: PriceSummaryProps) {
  const value = (amount: string, skeletonClass = 'h-5 w-20') =>
    loading ? (
      <Skeleton className={cn('inline-block align-middle', skeletonClass)} />
    ) : (
      <EthValue amount={amount} />
    )

  return (
    <dl aria-busy={loading || undefined} className={cn('flex flex-col gap-3 text-body', className)}>
      <div className="flex justify-between gap-4">
        <dt className="text-text-secondary">Subtotal</dt>
        <dd className="text-foreground">{value(summary.subtotalEth)}</dd>
      </div>
      {discount === 'when-applied' && isZero(summary.discountEth) ? null : (
        <div className="flex justify-between gap-4">
          <dt className="text-text-secondary">Desconto do lançamento</dt>
          <dd className="text-foreground">(-) {value(summary.discountEth, 'h-5 w-12')}</dd>
        </div>
      )}
      <div className="flex justify-between gap-4">
        <dt className="text-text-secondary">Taxa de rede</dt>
        <dd className="flex flex-col items-end text-foreground">
          {value(summary.networkFeeEth)}
          <span className="text-nano font-bold text-text-accent">Taxa estimada</span>
        </dd>
      </div>
      <div className="flex justify-between gap-4 border-t border-border pt-3 text-lead font-bold">
        <dt className="text-foreground">Total</dt>
        <dd className="text-text-accent">{value(summary.totalEth, 'h-6 w-24')}</dd>
      </div>
    </dl>
  )
}
