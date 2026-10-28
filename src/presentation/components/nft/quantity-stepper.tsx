import { MinusIcon, PlusIcon } from 'lucide-react'
import { useId } from 'react'

import { cn } from '@presentation/lib/utils'

type QuantityStepperProps = {
  readonly value: number
  readonly max: number
  readonly onChange: (value: number) => void
  readonly disabled?: boolean
  readonly label?: string
  readonly className?: string
}

const stepButtonClass =
  'focus-ring flex h-7.5 w-5 cursor-pointer items-center justify-center rounded-full border border-ink bg-primary text-primary-foreground shadow-field disabled:cursor-not-allowed disabled:opacity-40 md:h-12.5 md:w-8.25'

/** Quantidade limitada à disponibilidade da edição (botões em pílula do Figma). */
export function QuantityStepper({
  value,
  max,
  onChange,
  disabled = false,
  label = 'Quantidade',
  className,
}: QuantityStepperProps) {
  const inputId = useId()
  const clamp = (next: number) => Math.min(Math.max(1, next), Math.max(1, max))

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <label htmlFor={inputId} className="text-body leading-4 font-medium text-text-secondary md:sr-only">
        <span aria-hidden="true">Qtd.</span>
        <span className="sr-only">{label}</span>
      </label>
      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label="Diminuir quantidade"
          disabled={disabled || value <= 1}
          onClick={() => {
            onChange(clamp(value - 1))
          }}
          className={stepButtonClass}
        >
          <MinusIcon aria-hidden="true" className="size-4" />
        </button>
        <input
          id={inputId}
          type="number"
          inputMode="numeric"
          min={1}
          max={Math.max(1, max)}
          value={value}
          disabled={disabled}
          onChange={(event) => {
            const parsed = Number.parseInt(event.target.value, 10)
            if (!Number.isNaN(parsed)) onChange(clamp(parsed))
          }}
          className="w-8 [appearance:textfield] bg-transparent text-center text-lead font-medium text-foreground focus-ring md:text-title md:font-normal [&::-webkit-inner-spin-button]:appearance-none"
        />
        <button
          type="button"
          aria-label="Aumentar quantidade"
          disabled={disabled || value >= max}
          onClick={() => {
            onChange(clamp(value + 1))
          }}
          className={stepButtonClass}
        >
          <PlusIcon aria-hidden="true" className="size-4" />
        </button>
      </div>
    </div>
  )
}
