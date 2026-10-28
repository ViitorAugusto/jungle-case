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
  /** `checkout` (Figma Pagamento): "Taxa estimada" centralizada e o Total abaixo de uma divisória. */
  readonly variant?: 'cart' | 'checkout'
  readonly className?: string
}

const isZero = (amount: string) => /^0(\.0*)?$/.test(amount)

/**
 * Valores da cotação da API (o cliente não recalcula), exatamente como vieram
 * (premissa 16), com os rótulos do Figma. Cada rótulo vem logo antes do valor.
 * Sem desconto, o Figma mostra "(-) 00.00".
 */
export function PriceSummary({
  summary,
  discount = 'always',
  loading = false,
  variant = 'cart',
  className,
}: PriceSummaryProps) {
  const value = (amount: string, skeletonClass = 'h-5 w-20') =>
    loading ? (
      <Skeleton className={cn('inline-block align-middle', skeletonClass)} />
    ) : (
      <EthValue amount={amount} />
    )
  const noDiscount = isZero(summary.discountEth)
  // Pagamento: linhas de 20 px (Figma: passo de 32 px entre Subtotal, Desconto e Taxa).
  const amountClass = cn(
    'text-body-lg text-foreground md:text-lead',
    variant === 'checkout' && 'md:leading-5',
  )

  return (
    <dl aria-busy={loading || undefined} className={cn('flex flex-col gap-3 text-body', className)}>
      <div className="flex items-center justify-between gap-4">
        <dt className="text-foreground">Subtotal</dt>
        <dd className={amountClass}>{value(summary.subtotalEth)}</dd>
      </div>
      {discount === 'when-applied' && noDiscount ? null : (
        <div className="flex items-center justify-between gap-4">
          <dt className="text-foreground">Desconto do lançamento</dt>
          <dd className="text-body-lg text-foreground md:text-body">
            (-) {noDiscount && !loading ? '00.00' : value(summary.discountEth, 'h-5 w-12')}
          </dd>
        </div>
      )}
      {variant === 'checkout' ? (
        <div className="flex flex-wrap items-center justify-between gap-x-4">
          <dt className="text-foreground">Taxa de rede</dt>
          <dd className={amountClass}>{value(summary.networkFeeEth)}</dd>
          <dd className="mt-3.5 basis-full text-center text-small text-text-accent">Taxa estimada</dd>
        </div>
      ) : (
        <div className="flex justify-between gap-4">
          <dt className="text-foreground">Taxa de rede</dt>
          <dd className="flex flex-col items-end text-body-lg text-foreground md:text-lead">
            {value(summary.networkFeeEth)}
            <span className="text-small/3.5 text-text-accent md:mt-3">Taxa estimada</span>
          </dd>
        </div>
      )}
      <div
        className={cn(
          'flex items-center justify-between gap-4 font-bold',
          variant === 'checkout'
            ? '-mt-0.5 border-t border-primary/25 pt-2 pr-7.5 pl-10.5'
            : 'max-md:-mt-1 md:mt-1.5',
        )}
      >
        <dt className="text-body-lg text-foreground">Total</dt>
        <dd className="text-lead text-text-accent">{value(summary.totalEth, 'h-6 w-24')}</dd>
      </div>
    </dl>
  )
}
