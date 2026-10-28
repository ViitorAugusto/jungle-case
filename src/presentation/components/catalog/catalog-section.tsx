import { useNavigate, useSearch } from '@tanstack/react-router'
import { SlidersHorizontalIcon } from 'lucide-react'
import { useRef, useState } from 'react'

import {
  applyCatalogFilters,
  catalogTabs,
  DEFAULT_CATALOG_TAB,
  effectiveCatalogSort,
  isCatalogTab,
  parseCatalogSearch,
  type CatalogFilters,
  type CatalogSearch,
  type Nft,
} from '@application/dtos'

import type { CatalogFiltersPanelProps } from '@presentation/components/catalog/catalog-filters'
import { FiltersSkeleton } from '@presentation/components/catalog/catalog-filters-skeleton'
import { catalogTabLabels } from '@presentation/components/catalog/catalog-labels'
import { CatalogPagination } from '@presentation/components/catalog/catalog-pagination'
import { CatalogResults } from '@presentation/components/catalog/catalog-results'
import { CatalogSearchForm } from '@presentation/components/catalog/catalog-search-form'
import { CatalogSortSelect } from '@presentation/components/catalog/catalog-sort-select'
import { FeaturedBanner } from '@presentation/components/home/featured-banner'
import { CATALOG_ANCHOR } from '@presentation/components/layout/nav-items'
import { Button } from '@presentation/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@presentation/components/ui/tabs'
import { useCatalog } from '@presentation/hooks/use-catalog'
import { useMediaQuery } from '@presentation/hooks/use-media-query'
import { lazyWithRetry } from '@presentation/lib/lazy-with-retry'

// Filtros (Slider, drawer) fora do chunk inicial do Início: sidebar só no desktop, drawer só ao abrir.
const CatalogFiltersPanel = lazyWithRetry<CatalogFiltersPanelProps>(
  () =>
    import('@presentation/components/catalog/catalog-filters').then((module) => ({
      default: module.CatalogFiltersPanel,
    })),
  {
    fallback: (
      <div className="bg-surface-card p-5">
        <FiltersSkeleton />
      </div>
    ),
  },
)
const CatalogFiltersSheet = lazyWithRetry(
  () => import('@presentation/components/catalog/catalog-filters-sheet'),
)

/** Lê e escreve os search params do catálogo (filtros voltam à página 1). */
const useCatalogSearch = () => {
  // Sem 'strict': o Início também aparece sob /login e /cadastro (premissa 22).
  const search = parseCatalogSearch(useSearch({ strict: false }))
  const navigate = useNavigate()
  const update = (changes: CatalogFilters) =>
    void navigate({
      to: '/',
      search: (previous: CatalogSearch) => applyCatalogFilters(previous, changes),
      hash: CATALOG_ANCHOR,
      resetScroll: false,
    })
  return { search, update }
}

/** Topo do Início no mobile (Figma): busca e botão de filtros, que abre um drawer com os filtros e a ordenação. */
export function MobileCatalogBar() {
  const { search, update } = useCatalogSearch()
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [filtersRequested, setFiltersRequested] = useState(false)
  const filtersButton = useRef<HTMLButtonElement>(null)

  return (
    <div className="flex gap-2 lg:hidden">
      <CatalogSearchForm key={search.q ?? ''} defaultValue={search.q ?? ''} className="flex-1" />
      <Button
        ref={filtersButton}
        aria-label="Filtros"
        aria-haspopup="dialog"
        aria-expanded={filtersOpen}
        onPointerEnter={CatalogFiltersSheet.preload}
        onFocus={CatalogFiltersSheet.preload}
        onClick={() => {
          setFiltersRequested(true)
          setFiltersOpen(true)
        }}
        className="size-search rounded-xl bg-linear-135 from-primary/45 to-primary p-3"
      >
        <SlidersHorizontalIcon aria-hidden="true" className="size-5.5" />
      </Button>
      {filtersRequested ? (
        <CatalogFiltersSheet.Component
          open={filtersOpen}
          onOpenChange={setFiltersOpen}
          search={search}
          onChange={update}
          returnFocusTo={filtersButton}
        />
      ) : null}
    </div>
  )
}

type CatalogSectionProps = {
  readonly sideFeatured: Nft | undefined
}

/**
 * Catálogo do Início: sidebar de filtros + destaque (desktop), abas, ordenação,
 * grid e paginação. No mobile, busca e botão "Filtros" no topo da tela abrem
 * um drawer com os mesmos filtros.
 */
export function CatalogSection({ sideFeatured }: CatalogSectionProps) {
  const { search, update } = useCatalogSearch()
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const catalog = useCatalog(search)
  const tab = search.tab ?? DEFAULT_CATALOG_TAB
  const clearAll = () => {
    update({ q: undefined, collection: undefined, network: undefined, min: undefined, max: undefined })
  }

  return (
    <section id={CATALOG_ANCHOR} aria-labelledby="catalogo-titulo" className="scroll-mt-6">
      <h2 id="catalogo-titulo" className="sr-only">
        Catálogo de NFTs
      </h2>

      <div className="grid gap-12 lg:grid-cols-(--layout-catalog-columns)">
        <aside aria-label="Filtros do catálogo" className="hidden flex-col gap-6 lg:flex">
          {isDesktop ? <CatalogFiltersPanel.Component search={search} onChange={update} /> : null}
          <FeaturedBanner nft={sideFeatured} />
        </aside>

        <Tabs
          value={tab}
          onValueChange={(next) => {
            if (isCatalogTab(next)) update({ tab: next === DEFAULT_CATALOG_TAB ? undefined : next })
          }}
          className="min-w-0 gap-6 md:gap-8"
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <TabsList variant="line" aria-label="Seções do catálogo">
              {catalogTabs.map((value) => (
                <TabsTrigger key={value} value={value}>
                  {catalogTabLabels[value]}
                </TabsTrigger>
              ))}
            </TabsList>
            <div className="hidden md:block">
              <CatalogSortSelect
                value={effectiveCatalogSort(search)}
                onChange={(sort) => {
                  update({ sort })
                }}
              />
            </div>
          </div>

          {search.q ? (
            <p className="text-body-sm text-text-secondary">
              Resultados para <strong className="text-foreground">“{search.q}”</strong>{' '}
              <button
                type="button"
                onClick={() => {
                  update({ q: undefined })
                }}
                className="cursor-pointer rounded-xs text-text-accent underline underline-offset-4 focus-ring"
              >
                Limpar busca
              </button>
            </p>
          ) : null}

          <TabsContent value={tab} className="flex flex-col gap-14">
            <CatalogResults
              data={catalog.data}
              isPending={catalog.isPending}
              isError={catalog.isError}
              isUpdating={catalog.isPlaceholderData || (catalog.isFetching && catalog.isError)}
              onRetry={() => void catalog.refetch()}
              onClearFilters={clearAll}
            />
            {catalog.data ? (
              <CatalogPagination
                search={search}
                page={catalog.data.page}
                totalPages={catalog.data.totalPages}
                className="self-end"
              />
            ) : null}
          </TabsContent>
        </Tabs>
      </div>
    </section>
  )
}
