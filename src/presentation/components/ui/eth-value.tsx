import { cn } from '@presentation/lib/utils'

type EthValueProps = React.ComponentProps<'span'> & {
  /** Valor em ETH como a API envia (string decimal). */
  readonly amount: string
}

/**
 * Valor monetário em ETH (premissa 16): exibe a string da API exatamente como
 * veio, sem arredondar nem completar zeros, seguida de " ETH".
 */
function EthValue({ amount, className, ...props }: EthValueProps) {
  return (
    <span data-slot="eth-value" className={cn('tabular-nums', className)} {...props}>
      {amount} ETH
    </span>
  )
}

export { EthValue }
