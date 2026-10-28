import { useRouter } from '@tanstack/react-router'
import { ShoppingCartIcon } from 'lucide-react'
import { notify } from '@presentation/lib/notify'

import type { Nft, NftEdition } from '@application/dtos'

import { Button } from '@presentation/components/ui/button'
import { useAddToCart } from '@presentation/hooks/use-cart'
import { userMessageFor } from '@presentation/lib/errors'
import { cn } from '@presentation/lib/utils'

type NftPurchaseProps = {
  readonly nft: Nft
  readonly edition: NftEdition | undefined
  readonly quantity: number
  readonly className?: string
}

/**
 * "Comprar NFT" (adiciona e segue para o carrinho) e o botão de ícone
 * "Adicionar ao carrinho". A API revalida a disponibilidade; conflitos viram
 * toast com a mensagem dela.
 */
export function NftPurchase({ nft, edition, quantity, className }: NftPurchaseProps) {
  const addToCart = useAddToCart()
  const router = useRouter()
  const soldOut = !edition || edition.available === 0
  const disabled = soldOut || addToCart.isPending

  const add = (thenGoToCart: boolean) => {
    if (!edition) return
    addToCart.mutate(
      { nftId: nft.id, editionId: edition.id, quantity, available: edition.available },
      {
        onSuccess: () => {
          if (thenGoToCart) {
            void router.navigate({ to: '/carrinho' })
            return
          }
          notify.success(`${nft.name} (${edition.name}) adicionado ao carrinho.`, {
            action: {
              label: 'Ver carrinho',
              onClick: () => {
                void router.navigate({ to: '/carrinho' })
              },
            },
          })
        },
        onError: (error) => {
          const message = userMessageFor(error)
          if (message) notify.error(message)
        },
      },
    )
  }

  return (
    <div className={cn('flex items-center gap-3 md:gap-2', className)}>
      <Button
        aria-label="Comprar NFT"
        disabled={disabled}
        aria-busy={addToCart.isPending}
        onClick={() => {
          add(true)
        }}
        className="h-15 flex-1 rounded-full bg-linear-95 from-primary to-primary/80 text-body-lg md:h-10 md:w-32.5 md:flex-none md:rounded-sm md:bg-none md:text-body-sm"
      >
        {soldOut ? (
          'Esgotado'
        ) : (
          <>
            <span className="md:hidden">Comprar NFT</span>
            <span className="hidden md:inline">COMPRAR</span>
          </>
        )}
      </Button>
      <Button
        variant="secondary"
        aria-label="Adicionar ao carrinho"
        disabled={disabled}
        onClick={() => {
          add(false)
        }}
        className="size-15 rounded-full border border-border bg-surface-raised p-0 md:size-10 md:rounded-sm"
      >
        <ShoppingCartIcon aria-hidden="true" />
      </Button>
    </div>
  )
}
