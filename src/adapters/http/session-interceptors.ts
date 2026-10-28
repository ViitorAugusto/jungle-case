import { isAxiosError, type AxiosInstance } from 'axios'

import { ApplicationError } from '@application/errors/application-error'

import { toApplicationError } from '@adapters/http/http-error.mapper'

declare module 'axios' {
  interface AxiosRequestConfig {
    /** Não anexa token nem tenta renovação (login, cadastro, refresh). */
    skipAuth?: boolean
    /** Usuário da sessão no momento do envio; `null` = requisição anônima. */
    sessionUserId?: string | null
    retriedAfterRefresh?: boolean
  }
}

export type SessionBinding = {
  readonly current: () => { readonly userId: string; readonly accessToken: string } | null
  /** Renova a sessão e devolve o novo token de acesso. */
  readonly refresh: () => Promise<string>
  /** A API recusou a sessão de forma definitiva. */
  readonly onSessionInvalid: () => void
}

/** Motivo enviado pela API quando só o token de acesso venceu (renovável). */
export const TOKEN_EXPIRED_REASON = 'TOKEN_EXPIRED'

/**
 * Liga a sessão à instância Axios:
 * - anexa `Authorization` e registra de qual usuário é a requisição;
 * - em 401 `TOKEN_EXPIRED`, renova uma vez (renovação compartilhada) e repete;
 * - em 401 definitivo, encerra a sessão;
 * - descarta respostas de requisições autenticadas de uma sessão que já
 *   terminou, para que dado de um usuário nunca chegue ao cache de outro;
 * - normaliza toda falha para `ApplicationError`.
 */
export const installSessionInterceptors = (http: AxiosInstance, binding: SessionBinding): void => {
  http.interceptors.request.use((config) => {
    if (config.skipAuth) {
      config.sessionUserId = null
      return config
    }
    const session = binding.current()
    config.sessionUserId = session?.userId ?? null
    if (session) config.headers.set('Authorization', `Bearer ${session.accessToken}`)
    return config
  })

  http.interceptors.response.use(
    (response) => {
      const owner = response.config.sessionUserId
      if (owner && binding.current()?.userId !== owner) {
        throw new ApplicationError('CANCELED', 'Resposta de uma sessão encerrada descartada')
      }
      return response
    },
    async (error: unknown) => {
      const appError = toApplicationError(error)
      const config = isAxiosError(error) ? error.config : undefined
      const owner = config?.sessionUserId
      if (!config || !owner || appError.code !== 'UNAUTHENTICATED') throw appError
      if (binding.current()?.userId !== owner) {
        throw new ApplicationError('CANCELED', 'Resposta de uma sessão encerrada descartada')
      }

      if (appError.reason === TOKEN_EXPIRED_REASON && !config.retriedAfterRefresh) {
        let accessToken: string
        try {
          accessToken = await binding.refresh()
        } catch (refreshError) {
          throw toApplicationError(refreshError)
        }
        config.retriedAfterRefresh = true
        config.headers.set('Authorization', `Bearer ${accessToken}`)
        return http.request(config)
      }

      binding.onSessionInvalid()
      throw appError
    },
  )
}
