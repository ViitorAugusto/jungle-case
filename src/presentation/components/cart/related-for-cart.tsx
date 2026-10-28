import { NftCard } from '@presentation/components/nft/nft-card'
import { Skeleton } from '@presentation/components/ui/skeleton'
import { useCatalog } from '@presentation/hooks/use-catalog'

const COUNT = 5

/** "Colecionadores também viram" (Figma): 5 NFTs em alta, rolagem horizontal no mobile. */
export function RelatedForCart() {
  const trending = useCatalog({ tab: 'em-alta' }, { pageSize: COUNT })

  return (
    <section aria-labelledby="tambem-viram-titulo" className="flex flex-col gap-6 pt-8 md:pt-16">
      <div className="border-b border-primary/40 pb-3">
        <h2 id="tambem-viram-titulo" className="text-lead-sm font-bold text-text-accent">
          Colecionadores também viram
        </h2>
      </div>
      <ul
        aria-label="Colecionadores também viram"
        className="-mx-6 flex snap-x gap-4 overflow-x-auto px-6 pb-2 md:mx-0 md:grid md:grid-cols-3 md:gap-7 md:overflow-visible md:px-0 lg:grid-cols-5"
      >
        {trending.data
          ? trending.data.items.map((nft) => (
              <li key={nft.id} className="w-44 shrink-0 snap-start md:w-auto">
                <NftCard nft={nft} showFavorite={false} />
              </li>
            ))
          : Array.from({ length: COUNT }, (_, index) => (
              <li key={index} className="w-44 shrink-0 md:w-auto">
                <Skeleton className="aspect-219/255" />
              </li>
            ))}
      </ul>
    </section>
  )
}
