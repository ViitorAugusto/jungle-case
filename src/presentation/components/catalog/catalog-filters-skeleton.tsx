import { Skeleton } from '@presentation/components/ui/skeleton'

/** Placeholder do painel de filtros (mesmas seções e linhas do Figma). */
export function FiltersSkeleton() {
  return (
    <div aria-hidden="true" className="flex flex-col gap-10">
      {[9, 2, 3].map((rows, group) => (
        <div key={group} className="flex flex-col gap-3">
          <Skeleton className="h-4 w-24" />
          {Array.from({ length: rows }, (_, row) => (
            <Skeleton key={row} className="mx-3 h-6" />
          ))}
        </div>
      ))}
    </div>
  )
}
