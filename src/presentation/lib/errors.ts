import { isApplicationError } from '@application/dtos'

/** Mensagem pronta (pt-BR) para toast/alerta; `null` quando a falha não deve ser exibida. */
export const userMessageFor = (error: unknown): string | null => {
  if (isApplicationError(error)) return error.code === 'CANCELED' ? null : error.message
  return 'Algo deu errado. Tente novamente.'
}

export const isUnauthenticated = (error: unknown): boolean =>
  isApplicationError(error) && error.code === 'UNAUTHENTICATED'

export const isNotFound = (error: unknown): boolean => isApplicationError(error) && error.code === 'NOT_FOUND'
