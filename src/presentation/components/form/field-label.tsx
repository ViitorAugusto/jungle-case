import { cn } from '@presentation/lib/utils'

type FieldLabelProps = {
  readonly htmlFor: string
  readonly label: string
  readonly markRequired?: boolean | undefined
  readonly hidden?: boolean | undefined
}

/** Rótulo de campo; o "*" de obrigatório do Figma fica fora do nome acessível. */
export function FieldLabel({ htmlFor, label, markRequired, hidden }: FieldLabelProps) {
  return (
    <label htmlFor={htmlFor} className={cn('text-body font-normal text-foreground', hidden && 'sr-only')}>
      {label}
      {markRequired ? (
        <span aria-hidden="true" className="text-text-coral">
          *
        </span>
      ) : null}
    </label>
  )
}
