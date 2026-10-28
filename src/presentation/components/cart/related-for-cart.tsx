import { useEffect, useRef, useState, type RefObject } from 'react'

import { NftCard } from '@presentation/components/nft/nft-card'
import { Skeleton } from '@presentation/components/ui/skeleton'
import { useCatalog } from '@presentation/hooks/use-catalog'
import { cn } from '@presentation/lib/utils'

/** 3 páginas de 5 cards no desktop (Figma: pontos ○●○ abaixo do carrossel). */
const COUNT = 15
const VISIBLE = 5

const itemClass = 'w-44 shrink-0 snap-start md:w-(--layout-carousel-item)'

/** Uma página por largura visível do carrossel; a ativa acompanha a rolagem. */
function useCarouselPages(ref: RefObject<HTMLUListElement | null>, itemCount: number) {
  const [pages, setPages] = useState(1)
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    const list = ref.current
    if (!list) return
    const update = () => {
      setPages(Math.max(1, Math.round(list.scrollWidth / list.clientWidth)))
      setCurrent(Math.round(list.scrollLeft / list.clientWidth))
    }
    update()
    list.addEventListener('scroll', update, { passive: true })
    const observer = new ResizeObserver(update)
    observer.observe(list)
    return () => {
      list.removeEventListener('scroll', update)
      observer.disconnect()
    }
  }, [ref, itemCount])

  const goTo = (page: number) => {
    ref.current?.scrollTo({ left: page * ref.current.clientWidth, behavior: 'smooth' })
  }

  return { pages, current, goTo }
}

/**
 * "Colecionadores também viram" (Figma): NFTs em alta num carrossel de 5 por
 * página, com os pontos de paginação abaixo (botões nomeados pela página).
 */
export function RelatedForCart() {
  const trending = useCatalog({ tab: 'em-alta' }, { pageSize: COUNT })
  const items = trending.data?.items ?? []
  const listRef = useRef<HTMLUListElement>(null)
  const { pages, current, goTo } = useCarouselPages(listRef, items.length)

  return (
    <section aria-labelledby="tambem-viram-titulo" className="flex flex-col pt-8 md:pt-24.5">
      <div className="border-b border-primary/25 pb-2.75">
        <h2 id="tambem-viram-titulo" className="text-lead-sm font-bold text-text-accent">
          Colecionadores também viram
        </h2>
      </div>
      <ul
        ref={listRef}
        aria-label="Colecionadores também viram"
        className="-mx-7 mt-6 flex snap-x snap-mandatory [scrollbar-width:none] gap-4 overflow-x-auto px-7 pb-2 md:mx-0 md:mt-8 md:gap-7 md:px-0 md:pb-0"
      >
        {trending.data
          ? items.map((nft) => (
              <li key={nft.id} className={itemClass}>
                <NftCard nft={nft} showFavorite={false} />
              </li>
            ))
          : Array.from({ length: VISIBLE }, (_, index) => (
              <li key={index} className={itemClass}>
                <Skeleton className="aspect-219/255" />
              </li>
            ))}
      </ul>
      {pages > 1 ? (
        <div className="mt-7.5 hidden justify-center gap-2 md:flex">
          {Array.from({ length: pages }, (_, page) => (
            <button
              key={page}
              type="button"
              aria-label={`Página ${String(page + 1)} de ${String(pages)}`}
              aria-current={page === current ? 'true' : undefined}
              onClick={() => {
                goTo(page)
              }}
              className={cn(
                'size-3 cursor-pointer rounded-full border border-primary focus-ring',
                page === current ? 'bg-primary' : 'bg-transparent hover:bg-primary/40',
              )}
            />
          ))}
        </div>
      ) : null}
    </section>
  )
}
