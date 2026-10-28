import { isApplicationError } from '@application/dtos'

export type FieldMessages = Readonly<Record<string, readonly string[]>>

/**
 * Erros de campo de uma falha da API (422 com `fieldErrors`, ou 409 com o
 * campo indicado por `conflictField`). `null` quando a falha não é de campo.
 */
export const fieldErrorsOf = (error: unknown, conflictField?: string): FieldMessages | null => {
  if (!isApplicationError(error)) return null
  if (Object.keys(error.fieldErrors).length > 0) return error.fieldErrors
  if (error.code === 'CONFLICT' && conflictField) return { [conflictField]: [error.message] }
  return null
}

/** Foca o primeiro campo inválido dentro de `container`, depois que os erros aparecem. */
export const focusFirstInvalid = (container: HTMLElement | null) => {
  requestAnimationFrame(() => {
    container?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()
  })
}
