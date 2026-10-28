import { Link } from '@tanstack/react-router'
import { ArrowRightIcon } from 'lucide-react'

import type { CatalogTab } from '@application/dtos'

import { CATALOG_ANCHOR } from '@presentation/components/layout/nav-items'
import { NftImage } from '@presentation/components/nft/nft-image'
import { Button } from '@presentation/components/ui/button'
import { kurioArt } from '@presentation/lib/responsive-image'

const promos: readonly { title: string; text: string; image: string; tab: CatalogTab }[] = [
  {
    title: 'Lançamentos gênesis de edição limitada',
    text: 'Colecione edições escassas diretamente dos criadores antes da revelação pública.',
    image: kurioArt(1),
    tab: 'novos',
  },
  {
    title: 'Arte digital selecionada e muito mais',
    text: 'Explore novos artistas, coleções verificadas e obras digitais que definem a cultura.',
    image: kurioArt(3),
    tab: 'em-alta',
  },
]

/** Dois cards promocionais 586×250 do Figma; "Explorar" abre a aba correspondente do catálogo. */
export function HomePromos() {
  return (
    <section aria-label="Coleções em destaque" className="grid gap-7 defer-render lg:grid-cols-2">
      {promos.map((promo) => (
        <article
          key={promo.title}
          className="relative flex min-h-62.5 overflow-hidden rounded-md bg-surface-card"
        >
          <NftImage
            image={{ url: promo.image, alt: '' }}
            decorative
            sizes="(min-width: 1024px) 292px, 50vw"
            className="hidden aspect-auto w-1/2 shrink-0 rounded-2xl sm:block"
          />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-32 left-1/3 size-64 rounded-full border-2 border-primary/60"
          />
          <div className="relative flex flex-1 flex-col items-end justify-center gap-3 p-6 text-right">
            <h2 className="max-w-52 text-lead font-bold text-foreground">{promo.title}</h2>
            <p className="max-w-66 text-body-sm leading-6 text-text-secondary">{promo.text}</p>
            <Button asChild className="mt-1 w-35 justify-between px-6 text-body-sm font-medium">
              <Link to="/" search={{ tab: promo.tab }} hash={CATALOG_ANCHOR}>
                Explorar
                <ArrowRightIcon aria-hidden="true" className="size-icon-sm" />
              </Link>
            </Button>
          </div>
        </article>
      ))}
    </section>
  )
}
