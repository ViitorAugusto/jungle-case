import { CheckIcon } from 'lucide-react'
import { Checkbox as CheckboxPrimitive } from 'radix-ui'
import { useId } from 'react'

import type { FacetOption } from '@application/dtos'

import { cn } from '@presentation/lib/utils'

type FacetListProps = {
  readonly title: string
  readonly options: readonly FacetOption[]
  readonly selected: readonly string[]
  readonly onToggle: (id: string, checked: boolean) => void
}

/**
 * Lista de facetas do Figma (nome à esquerda, contagem à direita, linhas de
 * 40 px). Cada linha é um checkbox; o selecionado ganha a cor de destaque do
 * Figma e um ícone de check, para o estado não depender só da cor.
 */
export function FacetList({ title, options, selected, onToggle }: FacetListProps) {
  const titleId = useId()

  return (
    <section role="group" aria-labelledby={titleId} className="flex flex-col gap-3">
      <h3 id={titleId} className="text-lead leading-4 font-bold text-foreground">
        {title}
      </h3>
      <ul className="flex flex-col px-3">
        {options.map((option) => {
          const checked = selected.includes(option.id)
          const countId = `${titleId}-${option.id}`
          return (
            <li key={option.id}>
              <CheckboxPrimitive.Root
                checked={checked}
                onCheckedChange={(value) => {
                  onToggle(option.id, value === true)
                }}
                aria-label={option.label}
                aria-describedby={countId}
                className={cn(
                  'flex h-10 w-full cursor-pointer items-center justify-between gap-2 rounded-xs text-body leading-10 focus-ring',
                  checked ? 'text-text-accent' : 'text-text-secondary hover:text-foreground',
                )}
              >
                <span className="flex items-center gap-2">
                  <CheckboxPrimitive.Indicator forceMount className="data-[state=unchecked]:hidden">
                    <CheckIcon aria-hidden="true" className="size-4" strokeWidth={3} />
                  </CheckboxPrimitive.Indicator>
                  {option.label}
                </span>
                <span id={countId} className="font-bold">
                  <span className="sr-only">Quantidade: </span>({option.count})
                </span>
              </CheckboxPrimitive.Root>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
