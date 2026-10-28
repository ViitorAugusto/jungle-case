import type { Nft } from '@application/dtos'

import { NftCard } from '@presentation/components/nft/nft-card'
import { Skeleton } from '@presentation/components/ui/skeleton'
import { useCatalog } from '@presentation/hooks/use-catalog'

const RELATED_COUNT = 5

/** "Mais desta coleção": até 5 NFTs da mesma coleção, sem o atual. */
export function RelatedNfts({ nft }: { readonly nft: Nft }) {
  const related = useCatalog({ collection: [nft.collection.id] }, { pageSize: RELATED_COUNT + 1 })
  const items = (related.data?.items ?? []).filter((item) => item.id !== nft.id).slice(0, RELATED_COUNT)
  if (related.isSuccess && items.length === 0) return null

  return (
    <section aria-labelledby="relacionados-titulo" className="flex flex-col gap-8">
      <div className="border-b border-primary/40 pb-3">
        <h2 id="relacionados-titulo" className="text-lead-sm font-bold text-text-accent">
          Mais desta coleção
        </h2>
      </div>
      <ul aria-label="NFTs" className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:gap-7 lg:grid-cols-5">
        {related.isPending
          ? Array.from({ length: RELATED_COUNT }, (_, index) => (
              <li key={index}>
                <Skeleton className="aspect-219/255" />
              </li>
            ))
          : items.map((item) => (
              <li key={item.id}>
                {/* Sem favorito nos relacionados: "Favoritar" fica único na página, para o NFT exibido. */}
                <NftCard nft={item} showFavorite={false} />
              </li>
            ))}
      </ul>
    </section>
  )
}
