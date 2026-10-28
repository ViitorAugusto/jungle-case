import { Link } from '@tanstack/react-router'
import { ArrowRightIcon } from 'lucide-react'
import { useState } from 'react'

import type { Nft } from '@application/dtos'

import { CATALOG_ANCHOR } from '@presentation/components/layout/nav-items'
import { NftImage } from '@presentation/components/nft/nft-image'
import { Button } from '@presentation/components/ui/button'
import { Skeleton } from '@presentation/components/ui/skeleton'
import { cn } from '@presentation/lib/utils'

type HomeHeroProps = {
  readonly featured: readonly Nft[] | undefined
}

const MAX_SLIDES = 3

function SlideDots({
  count,
  active,
  onSelect,
  className,
}: {
  count: number
  active: number
  onSelect: (index: number) => void
  className?: string
}) {
  if (count < 2) return null
  return (
    // Alvo de toque de 24 px (WCAG 2.5.8) em volta do ponto de 7–8 px do Figma.
    <div role="group" aria-label="Destaques" className={cn('-mx-2 flex', className)}>
      {Array.from({ length: count }, (_, index) => (
        <button
          key={index}
          type="button"
          aria-label={`Destaque ${index + 1} de ${count}`}
          aria-pressed={index === active}
          onClick={() => {
            onSelect(index)
          }}
          className="group flex size-6 cursor-pointer items-center justify-center rounded-full focus-ring"
        >
          <span
            aria-hidden="true"
            className={cn(
              'size-1.75 rounded-full bg-primary md:size-2',
              index === active ? 'scale-125' : 'opacity-50 group-hover:opacity-80',
            )}
          />
        </button>
      ))}
    </div>
  )
}

function FeaturedArt({
  nft,
  className,
  priority,
}: {
  nft: Nft | undefined
  className: string
  priority?: boolean
}) {
  if (!nft) return <Skeleton className={className} />
  return (
    <Link
      to="/nfts/$nftId"
      params={{ nftId: nft.id }}
      aria-label={`Ver ${nft.name}`}
      className={cn('block overflow-hidden focus-ring', className)}
    >
      <NftImage
        image={nft.images[0]}
        priority={priority ?? false}
        sizes="(min-width: 768px) 450px, 138px"
        className="size-full"
      />
    </Link>
  )
}

/**
 * Hero do Início. Desktop: texto de 600 px à esquerda (padding 40) e a arte
 * em destaque 450×450 à direita. Mobile: banner de 190 px com gradiente,
 * texto à esquerda e arte de 138 px.
 */
export function HomeHero({ featured }: HomeHeroProps) {
  const slides = (featured ?? []).slice(0, MAX_SLIDES)
  const [active, setActive] = useState(0)
  const current = slides[active] ?? slides[0]

  return (
    <section aria-label="Destaques da Kurio">
      {/* Desktop e tablet */}
      <div className="hidden items-center justify-between gap-10 md:flex lg:gap-28 lg:pl-10">
        <div className="flex max-w-150 flex-col items-end gap-11">
          <div className="flex w-full flex-col items-start gap-8">
            <div className="flex flex-col gap-1">
              <p className="text-body-sm leading-4 font-medium tracking-brand text-foreground">
                Bem-vindo à Kurio
              </p>
              <h1 className="text-heading-lg font-bold text-foreground uppercase lg:text-display">
                Seja dono do futuro <br className="hidden lg:inline" />
                da arte digital
              </h1>
              <p className="max-w-139 text-body-sm leading-6 text-text-secondary">
                Descubra NFTs selecionados de criadores emergentes e consagrados. Colecione arte digital rara,
                apoie artistas e tenha uma parte da cultura da internet.
              </p>
            </div>
            <Button asChild className="w-35 pr-9 pl-7">
              <Link to="/" hash={CATALOG_ANCHOR}>
                EXPLORAR
              </Link>
            </Button>
          </div>
          <SlideDots count={slides.length} active={active} onSelect={setActive} />
        </div>
        <FeaturedArt
          nft={current}
          priority
          className="aspect-square w-full max-w-112.5 shrink-0 rounded-3xl"
        />
      </div>

      {/* Mobile */}
      <div className="flex flex-col items-center gap-4 md:hidden">
        <div className="relative w-full overflow-hidden rounded-3xl bg-linear-105 from-primary/20 to-primary/10 p-4">
          <span
            aria-hidden="true"
            className="absolute -top-16 -left-10 size-62 rounded-full bg-linear-160 from-primary-light/40 to-primary/0"
          />
          <div className="relative flex items-center gap-2">
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              <p className="text-small font-medium text-foreground">Bem-vindo à Kurio</p>
              <h1 className="text-lead leading-7 font-bold text-foreground uppercase">
                Seja dono da cultura digital
              </h1>
              <p className="text-small leading-compact text-text-secondary">
                Descubra NFTs selecionados de criadores do mundo todo.
              </p>
              <Link
                to="/"
                hash={CATALOG_ANCHOR}
                className="mt-1 inline-flex items-center gap-2 self-start rounded-xs text-small leading-3.5 font-bold text-text-accent focus-ring"
              >
                EXPLORAR
                <ArrowRightIcon aria-hidden="true" className="size-4" />
              </Link>
            </div>
            <FeaturedArt nft={current} priority className="aspect-square w-34.5 shrink-0 rounded-xl" />
          </div>
        </div>
        <SlideDots count={slides.length} active={active} onSelect={setActive} />
      </div>
    </section>
  )
}
