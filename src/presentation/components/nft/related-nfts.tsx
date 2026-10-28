import { useState } from 'react'

import type { Nft } from '@application/dtos'

import { CarouselDots } from '@presentation/components/nft/carousel-dots'
import { NftCard } from '@presentation/components/nft/nft-card'
import { Skeleton } from '@presentation/components/ui/skeleton'
import { useCatalog } from '@presentation/hooks/use-catalog'

/** Cards por página do carrossel (Figma: 5) e páginas (3 pontos). */
const PAGE_SIZE = 5
const MAX_PAGES = 3

/** "Mais desta coleção": carrossel de NFTs da mesma coleção, sem o atual, 5 por página. */
export function RelatedNfts({ nft }: { readonly nft: Nft }) {
  const related = useCatalog({ collection: [nft.collection.id] }, { pageSize: PAGE_SIZE * MAX_PAGES + 1 })
  const items = (related.data?.items ?? [])
    .filter((item) => item.id !== nft.id)
    .slice(0, PAGE_SIZE * MAX_PAGES)
  const pages = Math.ceil(items.length / PAGE_SIZE)
  const [page, setPage] = useState(0)
  const current = Math.min(page, Math.max(pages - 1, 0))
  if (related.isSuccess && items.length === 0) return null

  return (
    <section aria-labelledby="relacionados-titulo" className="flex flex-col gap-8">
      <div className="border-b border-primary/25 pb-3">
        <h2 id="relacionados-titulo" className="text-lead-sm font-bold text-text-accent">
          Mais desta coleção
        </h2>
      </div>
      <ul
        id="relacionados-lista"
        aria-label={pages > 1 ? `NFTs, página ${String(current + 1)} de ${String(pages)}` : 'NFTs'}
        aria-live="polite"
        className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:gap-6.5 lg:grid-cols-5"
      >
        {related.isPending
          ? Array.from({ length: PAGE_SIZE }, (_, index) => (
              <li key={index}>
                <Skeleton className="aspect-219/255" />
              </li>
            ))
          : items.slice(current * PAGE_SIZE, (current + 1) * PAGE_SIZE).map((item) => (
              <li key={item.id}>
                {/* Sem favorito nos relacionados: "Favoritar" fica único na página, para o NFT exibido. */}
                <NftCard nft={item} showFavorite={false} size="compact" />
              </li>
            ))}
      </ul>
      <CarouselDots
        count={pages}
        active={current}
        onSelect={setPage}
        label="Páginas de Mais desta coleção"
        controls="relacionados-lista"
        className="self-center"
      />
    </section>
  )
}
