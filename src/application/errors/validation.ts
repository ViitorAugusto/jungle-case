import { DomainError } from '@domain/errors/domain-error'

import { ApplicationError } from '@application/errors/application-error'

export const validationFailed = (fieldErrors: Record<string, string[]>) =>
  new ApplicationError('VALIDATION', 'Revise os campos destacados', { fieldErrors, status: 422 })

/** Barra a operação antes da rede quando a validação local já reprova a entrada. */
export const assertValid = (fieldErrors: Record<string, string[]>): void => {
  if (Object.keys(fieldErrors).length > 0) throw validationFailed(fieldErrors)
}

/** Converte violação de regra de domínio em erro de aplicação com o mesmo `reason`. */
export const toValidationError = (error: unknown): unknown =>
  error instanceof DomainError
    ? new ApplicationError('VALIDATION', error.message, { reason: error.code, cause: error })
    : error
