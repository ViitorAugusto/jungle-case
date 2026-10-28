import { Link } from '@tanstack/react-router'
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'

import { withCatalogPage, type CatalogSearch } from '@application/dtos'

import { CATALOG_ANCHOR } from '@presentation/components/layout/nav-items'
import { buttonVariants } from '@presentation/components/ui/button'
import { cn } from '@presentation/lib/utils'

type CatalogPaginationProps = {
  readonly search: CatalogSearch
  readonly page: number
  readonly totalPages: number
  readonly className?: string
}

const MAX_VISIBLE = 4

/** Janela de até 4 páginas em volta da atual (o Figma mostra 1–4 e a seta). */
const visiblePages = (page: number, totalPages: number): number[] => {
  const start = Math.max(1, Math.min(page - 1, totalPages - MAX_VISIBLE + 1))
  const end = Math.min(totalPages, start + MAX_VISIBLE - 1)
  return Array.from({ length: end - start + 1 }, (_, index) => start + index)
}

/** Paginação do Figma: quadrados de 35 px; página atual preenchida e marcada com aria-current. */
export function CatalogPagination({ search, page, totalPages, className }: CatalogPaginationProps) {
  if (totalPages <= 1) return null

  const linkTo = (target: number) => ({
    to: '/' as const,
    search: withCatalogPage(search, target),
    hash: CATALOG_ANCHOR,
  })
  const itemClass = cn(buttonVariants({ variant: 'outline', size: 'icon' }))

  return (
    <nav aria-label="Paginação" className={className}>
      <ul className="flex items-center gap-2">
        {page > 1 ? (
          <li>
            <Link {...linkTo(page - 1)} aria-label="Página anterior" className={itemClass}>
              <ChevronLeftIcon aria-hidden="true" className="size-icon-sm" />
            </Link>
          </li>
        ) : null}
        {visiblePages(page, totalPages).map((target) => {
          const current = target === page
          return (
            <li key={target}>
              <Link
                {...linkTo(target)}
                aria-label={`Página ${target}`}
                aria-current={current ? 'page' : undefined}
                className={cn(
                  itemClass,
                  current &&
                    'border-primary bg-primary font-bold text-primary-foreground hover:text-primary-foreground',
                )}
              >
                {target}
              </Link>
            </li>
          )
        })}
        {page < totalPages ? (
          <li>
            <Link {...linkTo(page + 1)} aria-label="Próxima página" className={itemClass}>
              <ChevronRightIcon aria-hidden="true" className="size-icon-sm" />
            </Link>
          </li>
        ) : null}
      </ul>
    </nav>
  )
}
