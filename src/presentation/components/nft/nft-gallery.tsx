import { useState } from 'react'

import type { Nft } from '@application/dtos'

import { NftImage } from '@presentation/components/nft/nft-image'
import { NFT_DETAIL_IMAGE_SIZES } from '@presentation/lib/responsive-image'
import { cn } from '@presentation/lib/utils'

/**
 * Galeria do detalhe. Desktop: miniaturas de 100 px em coluna (a ativa com
 * borda primária) e imagem principal 444×444 em Surface Card. Mobile: imagem
 * principal com indicadores de página.
 */
export function NftGallery({ nft }: { readonly nft: Nft }) {
  const [active, setActive] = useState(0)
  const images = nft.images
  const current = images[active] ?? images[0]

  return (
    <div className="flex flex-col items-center gap-4 md:flex-row md:items-center md:gap-7">
      {images.length > 1 ? (
        <ul aria-label="Imagens do NFT" className="order-2 flex md:order-1 md:flex-col md:gap-4">
          {images.map((image, index) => (
            <li key={image.url}>
              <button
                type="button"
                aria-label={`Imagem ${index + 1} de ${images.length}`}
                aria-current={index === active ? 'true' : undefined}
                onClick={() => {
                  setActive(index)
                }}
                className={cn(
                  'group flex h-6 min-w-6 cursor-pointer items-center justify-center rounded-full focus-ring',
                  'md:block md:size-25 md:overflow-hidden md:rounded-md md:border md:bg-surface-card',
                  index === active ? 'md:border-primary' : 'md:border-transparent',
                )}
              >
                {/* Mobile: indicador de página do Figma dentro de um alvo de toque de 24 px. */}
                <span
                  aria-hidden="true"
                  className={cn(
                    'h-1.75 rounded-full bg-primary md:hidden',
                    index === active ? 'w-7' : 'w-1.75',
                  )}
                />
                <NftImage image={image} decorative sizes="100px" className="hidden size-full md:block" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      <div className="order-1 w-full md:order-2 md:max-w-111 md:rounded-sm md:bg-surface-card md:p-4">
        <NftImage image={current} priority sizes={NFT_DETAIL_IMAGE_SIZES} className="w-full rounded-3xl" />
      </div>
    </div>
  )
}
