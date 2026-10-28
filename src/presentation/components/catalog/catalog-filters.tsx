import { nftNetworks, type CatalogFilters, type CatalogSearch, type NftNetwork } from '@application/dtos'

import { FacetList } from '@presentation/components/catalog/facet-list'
import { PriceRangeFilter } from '@presentation/components/catalog/price-range-filter'
import { Button } from '@presentation/components/ui/button'
import { FiltersSkeleton } from '@presentation/components/catalog/catalog-filters-skeleton'
import { useCatalogFacets } from '@presentation/hooks/use-catalog'
import { cn } from '@presentation/lib/utils'

export type CatalogFiltersPanelProps = {
  readonly search: CatalogSearch
  readonly onChange: (changes: CatalogFilters) => void
  readonly className?: string
}

const toggle = <T extends string>(
  list: readonly T[] | undefined,
  id: T,
  checked: boolean,
): T[] | undefined => {
  const next = checked ? [...(list ?? []), id] : (list ?? []).filter((item) => item !== id)
  return next.length > 0 ? next : undefined
}

const isNetwork = (id: string): id is NftNetwork => (nftNetworks as readonly string[]).includes(id)

/** Painel "Coleções / Faixa de preço / Rede" do Figma (sidebar no desktop, drawer no mobile). */
export function CatalogFiltersPanel({ search, onChange, className }: CatalogFiltersPanelProps) {
  const facets = useCatalogFacets()
  const hasFilters = [search.collection, search.network, search.min, search.max].some(
    (value) => value !== undefined,
  )

  return (
    <div className={cn('flex flex-col gap-10 bg-surface-card p-5', className)} aria-busy={facets.isPending}>
      {facets.data ? (
        <>
          <FacetList
            title="Coleções"
            options={facets.data.collections}
            selected={search.collection ?? []}
            onToggle={(id, checked) => {
              onChange({ collection: toggle(search.collection, id, checked) })
            }}
          />
          <PriceRangeFilter
            key={`${search.min ?? ''}-${search.max ?? ''}`}
            boundsEth={facets.data.priceRange}
            valueEth={{
              min: search.min ?? facets.data.priceRange.minEth,
              max: search.max ?? facets.data.priceRange.maxEth,
            }}
            onApply={({ min, max }) => {
              onChange({
                min: min === Number(facets.data.priceRange.minEth).toFixed(2) ? undefined : min,
                max: max === Number(facets.data.priceRange.maxEth).toFixed(2) ? undefined : max,
              })
            }}
          />
          <FacetList
            title="Rede"
            options={facets.data.networks}
            selected={search.network ?? []}
            onToggle={(id, checked) => {
              if (isNetwork(id)) onChange({ network: toggle(search.network, id, checked) })
            }}
          />
          {hasFilters ? (
            <Button
              variant="outline"
              size="sm"
              className="self-start"
              onClick={() => {
                onChange({ collection: undefined, network: undefined, min: undefined, max: undefined })
              }}
            >
              Limpar filtros
            </Button>
          ) : null}
        </>
      ) : facets.isError ? (
        <div role="alert" className="flex flex-col items-start gap-3 text-body-sm text-text-secondary">
          Não foi possível carregar os filtros.
          <Button size="sm" variant="outline" onClick={() => void facets.refetch()}>
            Tentar novamente
          </Button>
        </div>
      ) : (
        <FiltersSkeleton />
      )}
    </div>
  )
}
