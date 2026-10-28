import type { ComponentProps } from 'react'

import { FormField } from '@presentation/components/form/form-field'

const ENS_SUFFIX = '.eth'

/** Nome sem o sufixo, como o usuário digita. */
const ensLabelOf = (value: string) =>
  value.endsWith(ENS_SUFFIX) ? value.slice(0, -ENS_SUFFIX.length) : value
/** Valor enviado: nome + ".eth" (vazio continua vazio). */
const ensValueOf = (typed: string) => {
  const name = ensLabelOf(typed.trim())
  return name ? `${name}${ENS_SUFFIX}` : ''
}

type EnsFieldProps = Omit<ComponentProps<typeof FormField>, 'label' | 'value' | 'onChange' | 'trailing'> & {
  readonly value: string
  readonly onValueChange: (value: string) => void
}

/** "Nome ENS*" do Figma: o usuário digita o nome; o ".eth" é fixo e entra no valor. */
export function EnsField({ value, onValueChange, ...props }: EnsFieldProps) {
  return (
    <FormField
      label="Nome ENS"
      autoCapitalize="none"
      spellCheck={false}
      {...props}
      value={ensLabelOf(value)}
      onChange={(event) => {
        onValueChange(ensValueOf(event.target.value))
      }}
      trailing={
        <span
          aria-hidden="true"
          className="mr-1 rounded-xs bg-surface-raised px-2 py-1 text-small font-bold text-text-secondary"
        >
          {ENS_SUFFIX}
        </span>
      }
    />
  )
}
