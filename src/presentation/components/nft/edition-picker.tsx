import { RadioGroup as RadioGroupPrimitive } from 'radix-ui'
import { useId } from 'react'

import { isEditionAvailable, type NftEdition } from '@application/dtos'

import { cn } from '@presentation/lib/utils'

type EditionPickerProps = {
  readonly editions: readonly NftEdition[]
  readonly value: string
  readonly onChange: (editionId: string) => void
}

/**
 * "Edição:" do Figma: pílulas de 28 px com a tiragem (1/50). A selecionada tem
 * borda e texto de destaque e fica em negrito; esgotada fica desabilitada, com
 * borda tracejada e "Esgotada" no lugar da tiragem.
 */
export function EditionPicker({ editions, value, onChange }: EditionPickerProps) {
  const labelId = useId()

  return (
    <div className="flex flex-col gap-2 md:gap-3">
      <span id={labelId} className="text-body leading-4 font-bold text-foreground">
        Edição:
      </span>
      <RadioGroupPrimitive.Root
        aria-labelledby={labelId}
        value={value}
        onValueChange={onChange}
        orientation="horizontal"
        className="flex flex-wrap gap-3 md:gap-1.5"
      >
        {editions.map((edition) => {
          const soldOut = !isEditionAvailable(edition)
          return (
            <RadioGroupPrimitive.Item
              key={edition.id}
              value={edition.id}
              disabled={soldOut}
              aria-label={soldOut ? `${edition.name}, esgotada` : edition.name}
              className={cn(
                'inline-flex h-7 cursor-pointer items-center gap-1.5 rounded-full border border-border px-2 text-body-sm leading-4 text-text-secondary focus-ring hover:border-primary',
                'data-[state=checked]:border-primary data-[state=checked]:font-bold data-[state=checked]:text-text-accent',
                'disabled:cursor-not-allowed disabled:border-dashed disabled:opacity-70',
              )}
            >
              <span>{edition.name}</span>
              {/* Tiragem ("1/50") só nas disponíveis: na esgotada o rótulo seria lido como estoque. */}
              {soldOut ? (
                <span aria-hidden="true" className="text-small font-bold text-destructive-foreground">
                  Esgotada
                </span>
              ) : (
                <span aria-hidden="true" className="text-small">
                  1/{edition.supply}
                </span>
              )}
            </RadioGroupPrimitive.Item>
          )
        })}
      </RadioGroupPrimitive.Root>
    </div>
  )
}
