import { useRouter } from '@tanstack/react-router'
import { ChevronLeftIcon } from 'lucide-react'

import type { Nft } from '@application/dtos'

import { FavoriteButton } from '@presentation/components/nft/favorite-button'
import { Button } from '@presentation/components/ui/button'

/** Voltar e favoritar sobre a arte, no topo do detalhe mobile (Figma). */
export function NftMobileTopBar({ nft }: { readonly nft: Nft }) {
  const router = useRouter()

  return (
    <div className="absolute inset-x-7 top-5.75 z-10 flex items-center justify-between md:hidden">
      <Button
        variant="icon-round"
        aria-label="Voltar"
        onClick={() => {
          router.history.back()
        }}
      >
        <ChevronLeftIcon aria-hidden="true" className="size-4.5" />
      </Button>
      <FavoriteButton nft={nft} />
    </div>
  )
}
