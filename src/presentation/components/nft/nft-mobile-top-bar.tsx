import { useRouter } from '@tanstack/react-router'
import { ArrowLeftIcon } from 'lucide-react'

import type { Nft } from '@application/dtos'

import { FavoriteButton } from '@presentation/components/nft/favorite-button'
import { Button } from '@presentation/components/ui/button'

/** Voltar e favoritar sobre a arte, no topo do detalhe mobile (Figma). */
export function NftMobileTopBar({ nft }: { readonly nft: Nft }) {
  const router = useRouter()

  return (
    <div className="absolute inset-x-6 top-0 z-10 flex items-center justify-between md:hidden">
      <Button
        variant="icon-round"
        aria-label="Voltar"
        onClick={() => {
          router.history.back()
        }}
      >
        <ArrowLeftIcon aria-hidden="true" />
      </Button>
      <FavoriteButton nft={nft} />
    </div>
  )
}
