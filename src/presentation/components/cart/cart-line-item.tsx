import { Link } from '@tanstack/react-router'
import { Trash2Icon } from 'lucide-react'

import type { CartLine } from '@application/dtos'

import { cartLineGrid } from '@presentation/components/cart/cart-layout'
import { NftImage } from '@presentation/components/nft/nft-image'
import { QuantityStepper } from '@presentation/components/nft/quantity-stepper'
import { Button } from '@presentation/components/ui/button'
import { EthValue } from '@presentation/components/ui/eth-value'
import { useRemoveCartItem, useUpdateCartItem } from '@presentation/hooks/use-cart'
import { userMessageFor } from '@presentation/lib/errors'
import { notify } from '@presentation/lib/notify'
import { tokenIdOf } from '@presentation/lib/token-id'
import { cn } from '@presentation/lib/utils'

/** Disponibilidade na linha (premissa 20): "Resta 1", "N disponíveis" ou "Esgotado". */
const availabilityLabel = (available: number) =>
  available === 0 ? 'Esgotado' : available === 1 ? 'Resta 1' : `${available} disponíveis`

/**
 * Item do carrinho (Figma): arte 70 px, nome, ID do token e edição, preço
 * unitário, quantidade limitada ao estoque, total da linha em destaque e
 * remover. Quantidade acima do estoque (mudou em tempo real) fica destacada
 * com texto, não só cor.
 */
export function CartLineItem({ line }: { readonly line: CartLine }) {
  const update = useUpdateCartItem()
  const remove = useRemoveCartItem()
  const busy = update.isPending || remove.isPending
  const overAvailability = line.quantity > line.available

  const onError = (error: unknown) => {
    const message = userMessageFor(error)
    if (message) notify.error(message)
  }

  return (
    <li
      className={cn(
        'flex items-center gap-4 overflow-hidden rounded-2xl bg-surface-card p-3 md:rounded-none md:p-0 md:pr-4',
        cartLineGrid,
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-4">
        <NftImage
          image={{ url: line.imageUrl, alt: '' }}
          decorative
          sizes="80px"
          className="size-19.5 shrink-0 rounded-xl md:size-17.5 md:rounded-none"
        />
        <div className="flex min-w-0 flex-col gap-0.5">
          <h3 className="truncate text-body font-bold text-foreground">
            <Link
              to="/nfts/$nftId"
              params={{ nftId: line.nftId }}
              className="rounded-xs focus-ring hover:text-text-accent"
            >
              {line.nftName}
            </Link>
          </h3>
          <p className="text-small text-text-secondary">ID do token: {tokenIdOf(line.nftId)}</p>
          <p className="text-small text-primary-light">Edição: {line.editionName}</p>
          <p
            className={cn(
              'text-small font-medium',
              overAvailability || line.available === 0 ? 'text-destructive-foreground' : 'text-subtle',
            )}
          >
            {availabilityLabel(line.available)}
            {overAvailability && line.available > 0 ? ' — ajuste a quantidade' : null}
          </p>
          <p className="text-body-sm font-bold text-text-accent md:hidden">
            <EthValue amount={line.unitPriceEth} />
          </p>
        </div>
      </div>

      <p className="hidden text-body text-foreground md:block">
        <span className="sr-only">Preço unitário: </span>
        <EthValue amount={line.unitPriceEth} />
      </p>

      <QuantityStepper
        value={line.quantity}
        max={Math.max(line.available, line.quantity)}
        disabled={busy || line.available === 0}
        onChange={(quantity) => {
          update.mutate({ lineId: line.id, quantity, available: line.available }, { onError })
        }}
        className="shrink-0"
      />

      <p className="hidden text-body font-bold text-text-accent md:block">
        <span className="sr-only">Total do item: </span>
        <EthValue amount={line.lineTotalEth} />
      </p>

      <Button
        variant="ghost"
        size="icon"
        aria-label={`Remover ${line.nftName} (${line.editionName})`}
        disabled={busy}
        onClick={() => {
          remove.mutate(line.id, { onError })
        }}
        className="shrink-0 text-text-secondary hover:text-destructive-foreground"
      >
        <Trash2Icon aria-hidden="true" className="size-icon-sm" />
      </Button>
    </li>
  )
}
