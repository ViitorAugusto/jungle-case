import { useNavigate } from '@tanstack/react-router'
import { SearchIcon } from 'lucide-react'
import { useId, useState, type SyntheticEvent } from 'react'

import { applyCatalogFilters, parseCatalogSearch } from '@application/dtos'

import { CATALOG_ANCHOR } from '@presentation/components/layout/nav-items'
import { cn } from '@presentation/lib/utils'

type CatalogSearchFormProps = {
  readonly defaultValue?: string
  readonly placeholder?: string
  readonly className?: string
  readonly autoFocus?: boolean
  readonly onSubmitted?: () => void
}

/**
 * Busca do catálogo: aplica no Enter (sem debounce), mantém os demais filtros
 * da URL e volta para a página 1.
 */
export function CatalogSearchForm({
  defaultValue = '',
  placeholder = 'Explorar coleções',
  className,
  autoFocus,
  onSubmitted,
}: CatalogSearchFormProps) {
  const navigate = useNavigate()
  const [value, setValue] = useState(defaultValue)
  const inputId = useId()

  const submit = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault()
    void navigate({
      to: '/',
      search: (previous) =>
        applyCatalogFilters(parseCatalogSearch(previous), { q: value.trim() || undefined }),
      hash: CATALOG_ANCHOR,
    })
    onSubmitted?.()
  }

  return (
    <form role="search" onSubmit={submit} className={cn('relative flex items-center', className)}>
      <label htmlFor={inputId} className="sr-only">
        Buscar NFTs
      </label>
      <SearchIcon aria-hidden="true" className="pointer-events-none absolute left-3 size-5.5 text-subtle" />
      <input
        id={inputId}
        type="search"
        value={value}
        onChange={(event) => {
          setValue(event.target.value)
        }}
        placeholder={placeholder}
        autoFocus={autoFocus}
        enterKeyHint="search"
        className="h-search w-full rounded-field bg-surface-card pr-3 pl-11 text-body-sm font-bold text-foreground focus-ring placeholder:text-subtle"
      />
    </form>
  )
}
