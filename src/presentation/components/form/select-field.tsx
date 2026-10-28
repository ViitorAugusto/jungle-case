import { useId } from 'react'

import { FieldError } from '@presentation/components/form/field-error'
import { FieldLabel } from '@presentation/components/form/field-label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@presentation/components/ui/select'

export type SelectOption = { readonly value: string; readonly label: string }

type SelectFieldProps = {
  readonly label: string
  readonly placeholder: string
  readonly options: readonly SelectOption[]
  readonly value: string
  readonly onChange: (value: string) => void
  readonly errors?: readonly string[] | undefined
  readonly markRequired?: boolean
  readonly disabled?: boolean
}

/**
 * Select do formulário (Figma "Selecione uma rede"): rótulo, `combobox` do
 * shadcn com o mesmo visual dos campos e erro associado por `aria-describedby`.
 */
export function SelectField({
  label,
  placeholder,
  options,
  value,
  onChange,
  errors,
  markRequired,
  disabled = false,
}: SelectFieldProps) {
  const id = useId()
  const errorId = `${id}-erro`
  const invalid = Boolean(errors?.length)

  return (
    <div className="flex flex-col gap-2">
      <FieldLabel htmlFor={id} label={label} markRequired={markRequired} />
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger
          id={id}
          {...(markRequired ? { 'aria-required': true } : {})}
          aria-invalid={invalid || undefined}
          {...(invalid ? { 'aria-describedby': errorId } : {})}
          className="w-full rounded-sm border-input bg-surface-dark px-3 text-body-sm text-foreground focus-visible:border-ring disabled:opacity-70 data-[size=default]:h-10"
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent position="popper">
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {invalid && errors ? <FieldError id={errorId} errors={errors} /> : null}
    </div>
  )
}
