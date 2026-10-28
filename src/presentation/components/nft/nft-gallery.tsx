import { SearchIcon } from 'lucide-react'
import { useState } from 'react'

import type { Nft } from '@application/dtos'

import { NftImage } from '@presentation/components/nft/nft-image'
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@presentation/components/ui/dialog'
import { NFT_DETAIL_IMAGE_SIZES } from '@presentation/lib/responsive-image'
import { cn } from '@presentation/lib/utils'

/**
 * Galeria do detalhe. Desktop: 4 miniaturas de 100 px em coluna alinhadas ao
 * topo (a ativa com borda primária) e moldura 444×443 em Surface Card com a
 * arte de 404 px e a lupa no canto, que abre a arte ampliada. Mobile: só a
 * arte principal (o Figma não tem indicadores).
 */
export function NftGallery({ nft }: { readonly nft: Nft }) {
  const [active, setActive] = useState(0)
  const images = nft.images
  const current = images[active] ?? images[0]

  return (
    <div className="flex flex-col items-center md:flex-row md:items-start md:gap-7">
      {images.length > 1 ? (
        <ul aria-label="Imagens do NFT" className="hidden md:flex md:flex-col md:gap-4">
          {images.map((image, index) => (
            <li key={`${image.url}-${String(index)}`}>
              <button
                type="button"
                aria-label={`Imagem ${String(index + 1)} de ${String(images.length)}`}
                aria-current={index === active ? 'true' : undefined}
                onClick={() => {
                  setActive(index)
                }}
                className={cn(
                  'block size-25 cursor-pointer overflow-hidden rounded-md border bg-surface-card focus-ring',
                  index === active ? 'border-primary' : 'border-transparent',
                )}
              >
                <NftImage image={image} decorative sizes="100px" className="size-full" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      <div className="relative w-full md:max-w-111 md:rounded-sm md:bg-surface-card md:p-5">
        <NftImage
          image={current}
          priority
          sizes={NFT_DETAIL_IMAGE_SIZES}
          className="w-full rounded-3xl md:rounded-2xl"
        />
        <Dialog>
          <DialogTrigger asChild>
            <button
              type="button"
              aria-label="Ampliar imagem"
              className="absolute top-3.5 right-3.25 hidden size-7 cursor-pointer items-center justify-center rounded-full bg-surface-raised text-foreground focus-ring hover:text-text-accent md:flex"
            >
              <SearchIcon aria-hidden="true" className="size-4.5" />
            </button>
          </DialogTrigger>
          <DialogContent className="p-4 sm:max-w-zoom">
            <DialogTitle className="sr-only">{nft.name}</DialogTitle>
            <NftImage image={current} sizes="(min-width: 768px) 640px, 90vw" className="w-full rounded-2xl" />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
