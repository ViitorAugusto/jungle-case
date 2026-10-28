import type { RefObject } from 'react'

import { effectiveCatalogSort, type CatalogFilters, type CatalogSearch } from '@application/dtos'

import { CatalogFiltersPanel } from '@presentation/components/catalog/catalog-filters'
import { CatalogSortSelect } from '@presentation/components/catalog/catalog-sort-select'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@presentation/components/ui/sheet'

type CatalogFiltersSheetProps = {
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
  readonly search: CatalogSearch
  readonly onChange: (changes: CatalogFilters) => void
  /** Sem `SheetTrigger` (o drawer é lazy): o foco volta manualmente ao botão "Filtros". */
  readonly returnFocusTo: RefObject<HTMLButtonElement | null>
}

/** Drawer "Filtros" (< 1024 px) com ordenação e filtros. Carregado só no primeiro uso. */
export default function CatalogFiltersSheet({
  open,
  onOpenChange,
  search,
  onChange,
  returnFocusTo,
}: CatalogFiltersSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="max-h-[85dvh] overflow-y-auto rounded-t-3xl p-0"
        onCloseAutoFocus={(event) => {
          event.preventDefault()
          returnFocusTo.current?.focus()
        }}
      >
        <SheetHeader className="px-5 pt-5 pb-0">
          <SheetTitle className="text-lead">Filtros</SheetTitle>
          <SheetDescription className="text-small text-text-secondary">
            As mudanças se aplicam na hora e voltam para a página 1.
          </SheetDescription>
        </SheetHeader>
        <div className="px-5 pb-2">
          <CatalogSortSelect
            value={effectiveCatalogSort(search)}
            onChange={(sort) => {
              onChange({ sort })
            }}
          />
        </div>
        <CatalogFiltersPanel search={search} onChange={onChange} className="bg-transparent pb-8" />
      </SheetContent>
    </Sheet>
  )
}
