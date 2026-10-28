import { MinusIcon, PlusIcon } from 'lucide-react'
import { useId } from 'react'

import { cn } from '@presentation/lib/utils'

type QuantityStepperProps = {
  readonly value: number
  readonly max: number
  readonly onChange: (value: number) => void
  readonly disabled?: boolean
  readonly label?: string
  /** `detail`: pílulas grandes do Detalhe. `cart`: linha do carrinho (círculos de 20 px no mobile, pílulas de 18 × 30 no desktop). */
  readonly variant?: 'detail' | 'cart'
  readonly className?: string
}

const stepButtonBase =
  'focus-ring flex cursor-pointer items-center justify-center rounded-full disabled:cursor-not-allowed disabled:opacity-40'

const variants = {
  detail: {
    // Figma: pílulas laranja mesmo no limite (o limite vai em `disabled`/leitor de tela, sem esmaecer).
    button:
      'h-7.5 w-5 border border-ink bg-primary text-primary-foreground shadow-field disabled:opacity-100 md:h-12 md:w-7.75',
    icon: 'size-4 stroke-3',
    input: 'w-8 text-lead font-medium md:text-title md:font-normal',
    label: 'md:sr-only',
  },
  cart: {
    button:
      'size-5 bg-surface-raised text-foreground md:h-7.5 md:w-4.5 md:border md:border-ink md:bg-primary md:text-primary-foreground',
    icon: 'size-3',
    input: 'w-3.5 text-body',
    label: 'sr-only',
  },
} as const

/** Quantidade limitada à disponibilidade da edição (botões em pílula do Figma). */
export function QuantityStepper({
  value,
  max,
  onChange,
  disabled = false,
  label = 'Quantidade',
  variant = 'detail',
  className,
}: QuantityStepperProps) {
  const inputId = useId()
  const styles = variants[variant]
  const clamp = (next: number) => Math.min(Math.max(1, next), Math.max(1, max))

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <label
        htmlFor={inputId}
        className={cn('text-body leading-4 font-medium text-text-secondary', styles.label)}
      >
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
          className={cn(stepButtonBase, styles.button)}
        >
          <MinusIcon aria-hidden="true" className={styles.icon} />
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
          className={cn(
            '[appearance:textfield] bg-transparent text-center text-foreground focus-ring [&::-webkit-inner-spin-button]:appearance-none',
            styles.input,
          )}
        />
        <button
          type="button"
          aria-label="Aumentar quantidade"
          disabled={disabled || value >= max}
          onClick={() => {
            onChange(clamp(value + 1))
          }}
          className={cn(stepButtonBase, styles.button)}
        >
          <PlusIcon aria-hidden="true" className={styles.icon} />
        </button>
      </div>
    </div>
  )
}
