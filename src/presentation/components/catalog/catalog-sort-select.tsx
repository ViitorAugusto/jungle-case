import { ChevronDownIcon } from 'lucide-react'
import { useId } from 'react'

import { catalogSorts, isCatalogSort, type CatalogSort } from '@application/dtos'

import { catalogSortLabels } from '@presentation/components/catalog/catalog-labels'

type CatalogSortSelectProps = {
  readonly value: CatalogSort
  readonly onChange: (sort: CatalogSort) => void
}

/**
 * "Ordenar por:Listados recentemente ⌄" do Figma. `<select>` nativo
 * estilizado: mais leve que o Select do Radix e com teclado/leitor de tela
 * nativos em qualquer plataforma.
 */
export function CatalogSortSelect({ value, onChange }: CatalogSortSelectProps) {
  const selectId = useId()

  return (
    <div className="flex items-center text-body text-foreground">
      <label htmlFor={selectId}>Ordenar por:</label>
      <span className="relative inline-flex items-center">
        <select
          id={selectId}
          value={value}
          onChange={(event) => {
            if (isCatalogSort(event.target.value)) onChange(event.target.value)
          }}
          className="cursor-pointer appearance-none rounded-xs bg-transparent py-0 pr-4 pl-0 text-body text-foreground focus-ring"
        >
          {catalogSorts.map((sort) => (
            <option key={sort} value={sort} className="bg-popover text-popover-foreground">
              {catalogSortLabels[sort]}
            </option>
          ))}
        </select>
        <ChevronDownIcon aria-hidden="true" className="pointer-events-none absolute right-0 size-4" />
      </span>
    </div>
  )
}
