import { Skeleton } from '@presentation/components/ui/skeleton'

/** Carregamento do detalhe com as dimensões da galeria e do bloco de compra. */
export function NftDetailSkeleton() {
  return (
    <div aria-busy="true" aria-label="Carregando NFT" className="flex flex-col gap-3">
      <Skeleton className="hidden h-4 w-36 md:block" />
      <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
        <div className="flex gap-7 lg:w-143">
          <div className="hidden flex-col gap-4 md:flex">
            {Array.from({ length: 4 }, (_, index) => (
              <Skeleton key={index} className="size-25 rounded-md" />
            ))}
          </div>
          <Skeleton className="aspect-square w-full rounded-3xl md:max-w-111" />
        </div>
        <div className="flex flex-1 flex-col gap-5">
          <Skeleton className="h-9 w-2/3" />
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-7 w-56" />
          <Skeleton className="h-12 w-72" />
        </div>
      </div>
    </div>
  )
}
