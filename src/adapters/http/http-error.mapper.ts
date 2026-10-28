import { isAxiosError, isCancel } from 'axios'

import {
  ApplicationError,
  type ApplicationErrorCode,
  type FieldErrors,
} from '@application/errors/application-error'

/** Corpo de erro padronizado pela API (ver ARCHITECTURE.md, "Contratos REST"). */
type ApiErrorBody = {
  readonly message?: string
  readonly reason?: string
  readonly fieldErrors?: FieldErrors
}

const codeByStatus = (status: number): ApplicationErrorCode => {
  if (status === 400 || status === 422) return 'VALIDATION'
  if (status === 401) return 'UNAUTHENTICATED'
  if (status === 403) return 'FORBIDDEN'
  if (status === 404) return 'NOT_FOUND'
  if (status === 409) return 'CONFLICT'
  if (status === 408) return 'TIMEOUT'
  if (status === 429 || status >= 500) return 'TRANSIENT'
  return 'UNKNOWN'
}

/** Mensagem pt-BR usada quando a resposta não traz `message` (pode ir direto ao usuário). */
const fallbackMessage: Record<ApplicationErrorCode, string> = {
  VALIDATION: 'Revise os dados informados',
  UNAUTHENTICATED: 'Sua sessão expirou. Entre novamente para continuar',
  FORBIDDEN: 'Você não tem permissão para acessar este recurso',
  NOT_FOUND: 'Não encontramos o que você procurava',
  CONFLICT: 'A operação não pôde ser concluída por um conflito. Atualize e tente novamente',
  TRANSIENT: 'O serviço está instável no momento. Tente novamente',
  TIMEOUT: 'O servidor demorou para responder. Tente novamente',
  OFFLINE: 'Sem conexão com o servidor',
  CANCELED: 'Requisição cancelada',
  UNKNOWN: 'Algo deu errado. Tente novamente',
}

/** Traduz qualquer falha do Axios para um `ApplicationError` sem vazar detalhes de transporte. */
export const toApplicationError = (error: unknown): ApplicationError => {
  if (error instanceof ApplicationError) return error
  if (isCancel(error)) return new ApplicationError('CANCELED', fallbackMessage.CANCELED, { cause: error })
  if (!isAxiosError<ApiErrorBody | undefined>(error)) {
    return new ApplicationError('UNKNOWN', fallbackMessage.UNKNOWN, { cause: error })
  }

  if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
    return new ApplicationError('TIMEOUT', fallbackMessage.TIMEOUT, { cause: error })
  }

  const response = error.response
  if (!response) {
    return new ApplicationError('OFFLINE', fallbackMessage.OFFLINE, { cause: error })
  }

  const body = response.data
  const code = codeByStatus(response.status)
  return new ApplicationError(code, body?.message ?? fallbackMessage[code], {
    status: response.status,
    cause: error,
    ...(body?.fieldErrors ? { fieldErrors: body.fieldErrors } : {}),
    ...(body?.reason ? { reason: body.reason } : {}),
  })
}
