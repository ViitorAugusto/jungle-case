import { SearchXIcon } from 'lucide-react'

import { DEFAULT_PAGE_SIZE, type Nft, type Page } from '@application/dtos'

import { NftCard } from '@presentation/components/nft/nft-card'
import { Button } from '@presentation/components/ui/button'
import { Skeleton } from '@presentation/components/ui/skeleton'
import { pluralize } from '@presentation/lib/format'
import { cn } from '@presentation/lib/utils'

type CatalogResultsProps = {
  readonly data: Page<Nft> | undefined
  readonly isPending: boolean
  readonly isError: boolean
  /** Página anterior visível enquanto a nova carrega (keepPreviousData). */
  readonly isUpdating: boolean
  readonly onRetry: () => void
  readonly onClearFilters: () => void
}

/** Grid 3×3 no desktop; 2 colunas desencontradas no mobile (coluna direita 32 px abaixo, como no Figma). */
const gridClass =
  'grid grid-cols-2 gap-x-4 gap-y-6 md:grid-cols-3 md:gap-x-8 md:gap-y-18 max-md:[&>li:nth-child(even)]:translate-y-8 max-md:pb-8'

/** Primeira linha do catálogo (2 colunas no mobile): candidata a LCP, carrega sem lazy. */
const PRIORITY_CARDS = 2

export function NftCardSkeleton() {
  return (
    <div className="flex flex-col gap-2 md:gap-3">
      <Skeleton className="aspect-175/200 rounded-2xl md:aspect-258/300 md:rounded-none" />
      <div className="flex flex-col gap-1 pl-2 md:gap-3 md:pl-0">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/3" />
      </div>
    </div>
  )
}

/** Lista "NFTs" com os estados de carregamento, erro, vazio e atualização. */
export function CatalogResults({
  data,
  isPending,
  isError,
  isUpdating,
  onRetry,
  onClearFilters,
}: CatalogResultsProps) {
  if (isError && !data) {
    return (
      <div role="alert" className="flex flex-col items-center gap-4 bg-surface-card px-6 py-16 text-center">
        <p className="text-lead font-bold text-foreground">Não foi possível carregar os NFTs.</p>
        <p className="text-body-sm text-text-secondary">Verifique sua conexão e tente de novo.</p>
        <Button onClick={onRetry}>Tentar novamente</Button>
      </div>
    )
  }

  if (isPending || !data) {
    return (
      <ul aria-label="NFTs" aria-busy="true" className={gridClass}>
        {Array.from({ length: DEFAULT_PAGE_SIZE }, (_, index) => (
          <li key={index}>
            <NftCardSkeleton />
          </li>
        ))}
      </ul>
    )
  }

  if (data.items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 bg-surface-card px-6 py-16 text-center">
        <SearchXIcon aria-hidden="true" className="size-10 text-text-accent" />
        <h3 className="text-title font-bold text-foreground">Nenhum NFT encontrado</h3>
        <p className="max-w-md text-body-sm text-text-secondary">
          Ajuste a busca ou os filtros para ver outras peças do catálogo.
        </p>
        <Button variant="outline" onClick={onClearFilters}>
          Limpar filtros
        </Button>
      </div>
    )
  }

  return (
    <>
      <p role="status" className="sr-only">
        {pluralize(data.total, 'resultado', 'resultados')}
      </p>
      <ul
        aria-label="NFTs"
        aria-busy={isUpdating}
        className={cn(gridClass, 'transition-opacity', isUpdating && 'opacity-60')}
      >
        {data.items.map((nft, index) => (
          <li key={nft.id}>
            <NftCard nft={nft} priority={index < PRIORITY_CARDS} />
          </li>
        ))}
      </ul>
    </>
  )
}
