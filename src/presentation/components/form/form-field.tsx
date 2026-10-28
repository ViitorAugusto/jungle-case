import { useId, type ComponentProps, type ReactNode } from 'react'

import { FieldLabel } from '@presentation/components/form/field-label'
import { Input } from '@presentation/components/ui/input'
import { cn } from '@presentation/lib/utils'

type FormFieldProps = Omit<ComponentProps<typeof Input>, 'id'> & {
  readonly label: string
  /** Mensagens do campo (validação local ou `fieldErrors` da API). */
  readonly errors?: readonly string[] | undefined
  readonly hint?: string
  /** Dica só para leitores de tela (Figma sem texto de apoio visível). */
  readonly hideHint?: boolean
  /** Ação dentro do campo, à direita (ex.: mostrar senha). */
  readonly trailing?: ReactNode
  /** Controle à esquerda, fora do campo (ex.: select ".eth" do Nome ENS). */
  readonly leading?: ReactNode
  /** Mostra o "*" laranja do Figma (fora do nome acessível; a obrigatoriedade vai em aria-required). */
  readonly markRequired?: boolean
  /** Rótulo só para leitores de tela (campo sem rótulo visível no Figma). */
  readonly hideLabel?: boolean
}

/**
 * Rótulo + campo + erro associado (`aria-invalid` e `aria-describedby`). O erro
 * tem ícone textual "!" além da cor, para não depender só dela.
 */
export function FormField({
  label,
  errors,
  hint,
  hideHint,
  trailing,
  leading,
  markRequired,
  hideLabel,
  className,
  ref,
  ...props
}: FormFieldProps) {
  const id = useId()
  const errorId = `${id}-erro`
  const hintId = `${id}-dica`
  const invalid = Boolean(errors?.length)
  const describedBy = [hint ? hintId : null, invalid ? errorId : null].filter(Boolean).join(' ')

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <FieldLabel htmlFor={id} label={label} markRequired={markRequired} hidden={hideLabel} />
      <div className="flex gap-2.5">
        {leading}
        <div className="relative min-w-0 flex-1">
          <Input
            ref={ref}
            id={id}
            aria-invalid={invalid || undefined}
            {...(describedBy ? { 'aria-describedby': describedBy } : {})}
            {...props}
            className={cn(trailing ? 'pr-11' : null)}
          />
          {trailing ? <div className="absolute inset-y-0 right-1 flex items-center">{trailing}</div> : null}
        </div>
      </div>
      {hint ? (
        <p id={hintId} className={cn('text-small text-text-secondary', hideHint && 'sr-only')}>
          {hint}
        </p>
      ) : null}
      {invalid ? (
        <p id={errorId} className="flex items-start gap-1 text-small text-destructive-foreground">
          <span aria-hidden="true" className="font-bold">
            !
          </span>
          {errors?.join(' ')}
        </p>
      ) : null}
    </div>
  )
}
