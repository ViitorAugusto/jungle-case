/**
 * Categorias de falha que a aplicação conhece, independentes de transporte.
 * Adaptadores (HTTP, Socket.IO) traduzem erros técnicos para estes códigos.
 */
export const applicationErrorCodes = [
  'VALIDATION',
  'UNAUTHENTICATED',
  'FORBIDDEN',
  'NOT_FOUND',
  'CONFLICT',
  'TRANSIENT',
  'TIMEOUT',
  'OFFLINE',
  'CANCELED',
  'UNKNOWN',
] as const

export type ApplicationErrorCode = (typeof applicationErrorCodes)[number]

export type FieldErrors = Readonly<Record<string, readonly string[]>>

export type ApplicationErrorOptions = {
  readonly status?: number
  readonly fieldErrors?: FieldErrors
  readonly reason?: string
  readonly cause?: unknown
}

export class ApplicationError extends Error {
  readonly code: ApplicationErrorCode
  readonly status: number | undefined
  readonly fieldErrors: FieldErrors
  /** Detalhe de negócio enviado pela API (ex.: `COUPON_EXPIRED`, `EDITION_SOLD_OUT`). */
  readonly reason: string | undefined

  constructor(code: ApplicationErrorCode, message: string, options: ApplicationErrorOptions = {}) {
    super(message, { cause: options.cause })
    this.name = 'ApplicationError'
    this.code = code
    this.status = options.status
    this.fieldErrors = options.fieldErrors ?? {}
    this.reason = options.reason
  }

  /** Falhas que podem ser repetidas com segurança sem intervenção do usuário. */
  get isRetryable(): boolean {
    return this.code === 'TRANSIENT' || this.code === 'TIMEOUT' || this.code === 'OFFLINE'
  }
}

export const isApplicationError = (error: unknown): error is ApplicationError =>
  error instanceof ApplicationError
