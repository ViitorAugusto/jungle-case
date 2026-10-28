import { NftImage } from '@presentation/components/nft/nft-image'
import { EthValue } from '@presentation/components/ui/eth-value'
import { tokenIdOf } from '@presentation/lib/token-id'
import { cn } from '@presentation/lib/utils'

/** Campos comuns a linhas de carrinho, cotação e pedido. */
export type PurchaseLineData = {
  readonly nftId: string
  readonly nftName: string
  readonly editionName: string
  readonly imageUrl: string
  readonly quantity: number
  readonly lineTotalEth: string
}

/**
 * Linha de compra somente leitura (Figma "Seus NFTs" e "Detalhes da
 * transação"): arte, nome, ID do token, edição, "(x 2)" e subtotal em destaque.
 */
export function PurchaseLine({
  line,
  className,
}: {
  readonly line: PurchaseLineData
  readonly className?: string
}) {
  return (
    <li className={cn('flex items-center gap-3', className)}>
      <NftImage
        image={{ url: line.imageUrl, alt: '' }}
        decorative
        sizes="66px"
        className="size-16.5 shrink-0 rounded-md"
      />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <p className="truncate text-body font-bold text-foreground">{line.nftName}</p>
        <p className="truncate text-small text-text-secondary">ID do token: {tokenIdOf(line.nftId)}</p>
        <p className="truncate text-small text-primary-light">Edição: {line.editionName}</p>
      </div>
      <p className="w-12 shrink-0 text-center text-body-sm text-text-secondary">
        <span className="sr-only">Quantidade: </span>
        <span aria-hidden="true">(x {line.quantity})</span>
        <span className="sr-only">{line.quantity}</span>
      </p>
      <p className="min-w-20 shrink-0 text-right text-body font-bold whitespace-nowrap text-text-accent">
        <span className="sr-only">Subtotal: </span>
        <EthValue amount={line.lineTotalEth} />
      </p>
    </li>
  )
}
