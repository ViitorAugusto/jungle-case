import { NftImage } from '@presentation/components/nft/nft-image'
import { EthValue } from '@presentation/components/ui/eth-value'
import { cn } from '@presentation/lib/utils'

/** Campos comuns a linhas de carrinho, cotação e pedido. */
export type PurchaseLineData = {
  readonly nftId: string
  readonly tokenId: string
  readonly nftName: string
  readonly editionName: string
  readonly imageUrl: string
  readonly quantity: number
  readonly lineTotalEth: string
}

/**
 * Linha de compra somente leitura. `checkout` (Figma "Seus NFTs"): faixa de
 * 70 px com fundo, arte, nome inteiro, ID do token, "(x 2)" e subtotal.
 * `receipt` (Figma "Detalhes da transação"): sem fundo, nas colunas NFTs ·
 * Edições · Subtotal do recibo. A edição fica para leitores de tela (o Figma
 * não a mostra).
 */
export function PurchaseLine({
  line,
  variant = 'checkout',
  className,
}: {
  readonly line: PurchaseLineData
  readonly variant?: 'checkout' | 'receipt'
  readonly className?: string
}) {
  const receipt = variant === 'receipt'
  return (
    <li
      className={cn(
        receipt
          ? 'grid h-17.5 grid-cols-(--layout-receipt-line) items-center'
          : 'flex h-17.5 items-center gap-1.5 bg-surface-card pr-3 pl-1',
        className,
      )}
    >
      <div className={cn('flex min-w-0 items-center', receipt ? 'gap-3' : 'flex-1 gap-1.5')}>
        <div className="size-17.5 shrink-0">
          <NftImage
            image={{ url: line.imageUrl, alt: '' }}
            decorative
            sizes="70px"
            className={cn('size-full', receipt ? 'rounded-md' : 'rounded-sm')}
          />
        </div>
        <div className="flex min-w-0 flex-col gap-0.75">
          <p className="text-body-lg leading-5 font-bold text-foreground">{line.nftName}</p>
          <p className="text-caption text-subtle">
            ID do token: {line.tokenId}
            <span className="sr-only">, edição {line.editionName}</span>
          </p>
        </div>
      </div>
      <p className={cn('shrink-0 text-body text-text-secondary', receipt && 'text-center')}>
        <span className="sr-only">Quantidade: {line.quantity}</span>
        <span aria-hidden="true">(x {line.quantity})</span>
      </p>
      <p className="min-w-21.5 shrink-0 text-right text-lead font-bold whitespace-nowrap text-text-accent">
        <span className="sr-only">Subtotal: </span>
        <EthValue amount={line.lineTotalEth} />
      </p>
    </li>
  )
}
