import { Link } from '@tanstack/react-router'
import { TrashIcon } from 'lucide-react'

import type { CartLine } from '@application/dtos'

import { cartLineGrid } from '@presentation/components/cart/cart-layout'
import { NftImage } from '@presentation/components/nft/nft-image'
import { QuantityStepper } from '@presentation/components/nft/quantity-stepper'
import { Button } from '@presentation/components/ui/button'
import { EthValue } from '@presentation/components/ui/eth-value'
import { useRemoveCartItem, useUpdateCartItem } from '@presentation/hooks/use-cart'
import { userMessageFor } from '@presentation/lib/errors'
import { notify } from '@presentation/lib/notify'
import { cn } from '@presentation/lib/utils'

/** Disponibilidade na linha (premissa 20): "Resta 1", "N disponíveis" ou "Esgotado". */
const availabilityLabel = (available: number) =>
  available === 0 ? 'Esgotado' : available === 1 ? 'Resta 1' : `${available} disponíveis`

/**
 * Item do carrinho (Figma). Desktop: linha de 70 px nas colunas NFTs · Preço ·
 * Edições · Total, com nome e ID do token. Mobile: card de 100 px com a arte
 * encostada à esquerda, nome, edição e preço, e a quantidade à direita.
 * A disponibilidade só aparece quando importa (última unidade, esgotado ou
 * quantidade acima do estoque, que muda em tempo real), com texto e não só cor.
 */
export function CartLineItem({ line }: { readonly line: CartLine }) {
  const update = useUpdateCartItem()
  const remove = useRemoveCartItem()
  const busy = update.isPending || remove.isPending
  const overAvailability = line.quantity > line.available
  const showAvailability = overAvailability || line.available <= 1

  const onError = (error: unknown) => {
    const message = userMessageFor(error)
    if (message) notify.error(message)
  }

  return (
    <li
      className={cn(
        'relative flex min-h-25 items-center overflow-hidden rounded-lg bg-surface-card pr-4 md:min-h-17.5 md:rounded-none',
        cartLineGrid,
      )}
    >
      <div className="flex min-w-0 flex-1 items-start gap-2.25 self-stretch md:items-center md:gap-4">
        <div className="size-25 shrink-0 md:size-17.5">
          <NftImage
            image={{ url: line.imageUrl, alt: '' }}
            decorative
            sizes="100px"
            className="size-full md:rounded-xs"
          />
        </div>
        <div className="flex min-w-0 flex-col pt-3 md:pt-0">
          <h3 className="text-body font-bold text-foreground md:text-body-lg">
            <Link
              to="/nfts/$nftId"
              params={{ nftId: line.nftId }}
              className="rounded-xs focus-ring hover:text-text-accent"
            >
              {line.nftName}
            </Link>
          </h3>
          <p className="hidden text-caption text-subtle md:mt-0.75 md:block">ID do token: {line.tokenId}</p>
          <p className="mt-1 text-body-sm leading-4 text-subtle md:sr-only">Edição: {line.editionName}</p>
          {showAvailability ? (
            <p className="mt-1 text-small font-medium text-destructive-foreground">
              {availabilityLabel(line.available)}
              {overAvailability && line.available > 0 ? ' — ajuste a quantidade' : null}
            </p>
          ) : null}
          <p className="mt-3.5 mb-2 text-lead font-bold text-text-accent md:hidden">
            <EthValue amount={line.unitPriceEth} />
          </p>
        </div>
      </div>

      <p className="hidden text-body-lg font-bold text-text-secondary md:block">
        <span className="sr-only">Preço unitário: </span>
        <EthValue amount={line.unitPriceEth} />
      </p>

      <QuantityStepper
        variant="cart"
        value={line.quantity}
        max={Math.max(line.available, line.quantity)}
        disabled={busy || line.available === 0}
        onChange={(quantity) => {
          update.mutate({ lineId: line.id, quantity, available: line.available }, { onError })
        }}
        className="shrink-0"
      />

      <p className="hidden text-body-lg font-bold text-text-accent md:block">
        <span className="sr-only">Total do item: </span>
        <EthValue amount={line.lineTotalEth} />
      </p>

      {/* Mobile: o Figma não reserva lugar para remover; o ícone fica no canto do card. */}
      <Button
        variant="ghost"
        size="icon"
        aria-label={`Remover ${line.nftName} (${line.editionName})`}
        disabled={busy}
        onClick={() => {
          remove.mutate(line.id, { onError })
        }}
        className="absolute top-1 right-1 size-7 text-subtle hover:text-destructive-foreground md:static md:size-control md:justify-self-center"
      >
        <TrashIcon aria-hidden="true" className="size-4" />
      </Button>
    </li>
  )
}
