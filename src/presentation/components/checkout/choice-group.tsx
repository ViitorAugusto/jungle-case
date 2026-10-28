import { CheckIcon } from 'lucide-react'
import { RadioGroup as RadioGroupPrimitive } from 'radix-ui'
import { useId, type ReactNode } from 'react'

import { cn } from '@presentation/lib/utils'

export type ChoiceOption = {
  readonly value: string
  /** Nome acessível do rádio (ex.: "Ethereum", "Carteira principal"). */
  readonly label: string
  readonly description?: ReactNode
  readonly icon?: ReactNode
}

type ChoiceGroupProps = {
  readonly legend: string
  readonly options: readonly ChoiceOption[]
  readonly value: string | null
  readonly onChange: (value: string) => void
  /** Clique em qualquer cartão, inclusive no já marcado (ex.: reconectar o provedor escolhido). */
  readonly onPick?: (value: string) => void
  readonly error?: string | undefined
  /** `auto`: cartões lado a lado quando cabem; `single`: um por linha (coluna do resumo). */
  readonly columns?: 'auto' | 'single'
  readonly disabled?: boolean
  readonly className?: string
}

/**
 * Grupo de cartões selecionáveis (carteira, rede): `radiogroup` nomeado pela
 * legenda, cada cartão é um `radio` com borda primária e check quando marcado.
 */
export function ChoiceGroup({
  legend,
  options,
  value,
  onChange,
  onPick,
  error,
  columns = 'auto',
  disabled = false,
  className,
}: ChoiceGroupProps) {
  const legendId = useId()
  const errorId = useId()

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <span id={legendId} className="text-body-sm font-bold text-foreground">
        {legend}
      </span>
      <RadioGroupPrimitive.Root
        aria-labelledby={legendId}
        {...(error ? { 'aria-describedby': errorId, 'aria-invalid': true } : {})}
        value={value ?? ''}
        onValueChange={onChange}
        disabled={disabled}
        className={cn('grid gap-3', columns === 'auto' && 'sm:grid-cols-(--layout-choice-columns)')}
      >
        {options.map((option) => (
          <RadioGroupPrimitive.Item
            key={option.value}
            value={option.value}
            {...(onPick
              ? {
                  onClick: () => {
                    onPick(option.value)
                  },
                }
              : {})}
            aria-label={option.label}
            className="group flex min-h-14 cursor-pointer items-center gap-3 rounded-sm border border-border bg-surface-dark px-4 py-3 text-left focus-ring hover:border-primary disabled:cursor-not-allowed disabled:opacity-60 data-[state=checked]:border-primary data-[state=checked]:bg-primary/10"
          >
            {option.icon}
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="text-body-sm font-bold text-foreground">{option.label}</span>
              {option.description ? (
                <span className="truncate text-small text-text-secondary">{option.description}</span>
              ) : null}
            </span>
            <span
              aria-hidden="true"
              className="flex size-5 shrink-0 items-center justify-center rounded-full border border-border-soft group-data-[state=checked]:border-primary group-data-[state=checked]:bg-primary"
            >
              <CheckIcon className="hidden size-3.5 text-primary-foreground group-data-[state=checked]:block" />
            </span>
          </RadioGroupPrimitive.Item>
        ))}
      </RadioGroupPrimitive.Root>
      {error ? (
        <p id={errorId} className="flex items-start gap-1 text-small text-destructive-foreground">
          <span aria-hidden="true" className="font-bold">
            !
          </span>
          {error}
        </p>
      ) : null}
    </div>
  )
}
