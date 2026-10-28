/** Mensagem de erro de campo: ícone textual "!" além da cor (R72). */
export function FieldError({ id, errors }: { readonly id: string; readonly errors: readonly string[] }) {
  return (
    <p id={id} className="flex items-start gap-1 text-small text-destructive-foreground">
      <span aria-hidden="true" className="font-bold">
        !
      </span>
      {errors.join(' ')}
    </p>
  )
}
