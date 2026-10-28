import type { NftImage as NftImageData } from '@application/dtos'

import { responsiveSources } from '@presentation/lib/responsive-image'
import { cn } from '@presentation/lib/utils'

type NftImageProps = {
  readonly image: NftImageData | undefined
  readonly className?: string
  /** Imagem acima da dobra (hero, galeria): carrega com prioridade. */
  readonly priority?: boolean
  /** Imagem decorativa (o nome já está ao lado): alt vazio. */
  readonly decorative?: boolean
  /** Largura exibida por breakpoint, para o navegador escolher a variante. */
  readonly sizes?: string
}

/** Lado intrínseco das artes (quadradas): reserva o espaço e evita deslocamento de layout. */
const INTRINSIC_SIZE = 640

/**
 * Arte do NFT em proporção quadrada. Para as artes otimizadas, `<picture>` com
 * AVIF, WebP e JPEG em larguras responsivas; outras URLs viram `<img>` simples.
 */
export function NftImage({
  image,
  className,
  priority = false,
  decorative = false,
  sizes = '100vw',
}: NftImageProps) {
  if (!image) return <div aria-hidden="true" className={cn('aspect-square bg-surface-raised', className)} />

  const sources = responsiveSources(image.url)
  const img = (
    <img
      src={image.url}
      {...(sources ? { srcSet: sources.jpg, sizes } : {})}
      alt={decorative ? '' : image.alt}
      width={INTRINSIC_SIZE}
      height={INTRINSIC_SIZE}
      loading={priority ? 'eager' : 'lazy'}
      fetchPriority={priority ? 'high' : 'auto'}
      decoding="async"
      className={cn('aspect-square object-cover', className)}
    />
  )
  if (!sources) return img

  return (
    <picture className="contents">
      <source type="image/avif" srcSet={sources.avif} sizes={sizes} />
      <source type="image/webp" srcSet={sources.webp} sizes={sizes} />
      {img}
    </picture>
  )
}
