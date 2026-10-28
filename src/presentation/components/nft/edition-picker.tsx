import { RadioGroup as RadioGroupPrimitive } from 'radix-ui'
import { useId } from 'react'

import { isEditionAvailable, isOpenEdition, type NftEdition } from '@application/dtos'

import { cn } from '@presentation/lib/utils'

type EditionPickerProps = {
  readonly editions: readonly NftEdition[]
  readonly value: string
  readonly onChange: (editionId: string) => void
}

/** Tiragem exibida no chip: "1/50" ou "ABERTA" (edição sem limite). */
const editionTag = (edition: NftEdition) =>
  isOpenEdition(edition) ? 'ABERTA' : `1/${String(edition.supply)}`

/**
 * "Edição:" do Figma: chips de 24 px só com a tiragem (1/1, 1/10, 1/50, ABERTA),
 * na ordem da API; o nome da edição vai no nome acessível. A selecionada tem
 * borda e texto de destaque em negrito. Esgotada fica desabilitada, com borda
 * tracejada e "esgotada" no nome acessível.
 */
export function EditionPicker({ editions, value, onChange }: EditionPickerProps) {
  const labelId = useId()

  return (
    <div className="flex flex-col gap-2 md:gap-3.5">
      <span id={labelId} className="text-body leading-4 font-bold text-foreground">
        Edição:
      </span>
      <RadioGroupPrimitive.Root
        aria-labelledby={labelId}
        value={value}
        onValueChange={onChange}
        className="flex flex-wrap gap-1.5"
      >
        {editions.map((edition) => {
          const soldOut = !isEditionAvailable(edition)
          const tag = editionTag(edition)
          return (
            <RadioGroupPrimitive.Item
              key={edition.id}
              value={edition.id}
              disabled={soldOut}
              aria-label={`${edition.name} ${tag}${soldOut ? ', esgotada' : ''}`}
              className={cn(
                'inline-flex h-6 cursor-pointer items-center rounded-full border border-border px-1.75 text-body-sm leading-4 text-text-secondary focus-ring hover:border-primary',
                'data-[state=checked]:border-primary data-[state=checked]:font-bold data-[state=checked]:text-text-accent',
                'disabled:cursor-not-allowed disabled:border-dashed disabled:hover:border-border',
              )}
            >
              <span aria-hidden="true">{tag}</span>
              {/* Estado também em texto (R72), além da borda tracejada. */}
              {soldOut ? <span className="sr-only">Esgotada</span> : null}
            </RadioGroupPrimitive.Item>
          )
        })}
      </RadioGroupPrimitive.Root>
    </div>
  )
}
