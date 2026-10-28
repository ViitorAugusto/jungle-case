import type { ComponentProps } from 'react'

import { FormField } from '@presentation/components/form/form-field'
import { selectFieldTriggerClass } from '@presentation/components/form/select-field'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@presentation/components/ui/select'
import { cn } from '@presentation/lib/utils'

const ENS_SUFFIX = '.eth'
/** Domínios aceitos no select do Figma (hoje só ".eth"). */
const ENS_SUFFIXES = [ENS_SUFFIX] as const

/** Nome sem o sufixo, como o usuário digita. */
const ensLabelOf = (value: string) =>
  value.endsWith(ENS_SUFFIX) ? value.slice(0, -ENS_SUFFIX.length) : value
/** Valor enviado: nome + ".eth" (vazio continua vazio). */
const ensValueOf = (typed: string) => {
  const name = ensLabelOf(typed.trim())
  return name ? `${name}${ENS_SUFFIX}` : ''
}

type EnsFieldProps = Omit<
  ComponentProps<typeof FormField>,
  'label' | 'value' | 'onChange' | 'trailing' | 'leading'
> & {
  readonly value: string
  readonly onValueChange: (value: string) => void
}

/**
 * "Nome ENS*" do Figma: select ".eth ⌄" de 78 px e, ao lado, o campo do nome.
 * O valor enviado é nome + domínio.
 */
export function EnsField({ value, onValueChange, readOnly, disabled, ...props }: EnsFieldProps) {
  return (
    <FormField
      label="Nome ENS"
      autoCapitalize="none"
      spellCheck={false}
      readOnly={readOnly}
      disabled={disabled}
      {...props}
      value={ensLabelOf(value)}
      onChange={(event) => {
        onValueChange(ensValueOf(event.target.value))
      }}
      leading={
        <Select value={ENS_SUFFIX} disabled={Boolean(readOnly) || Boolean(disabled)}>
          <SelectTrigger
            aria-label="Domínio ENS"
            className={cn(selectFieldTriggerClass, 'w-ens-suffix shrink-0 gap-1 px-2.5')}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent position="popper">
            {ENS_SUFFIXES.map((suffix) => (
              <SelectItem key={suffix} value={suffix}>
                {suffix}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      }
    />
  )
}
