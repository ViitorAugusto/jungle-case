import { expect, test } from '@playwright/test'
import axios, { AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios'

import { installSessionInterceptors } from '@adapters/http/session-interceptors'

type Handler = (config: InternalAxiosRequestConfig) => Promise<AxiosResponse>

const respond = (
  config: InternalAxiosRequestConfig,
  status: number,
  data: unknown,
): Promise<AxiosResponse> => {
  const response = { data, status, statusText: String(status), headers: {}, config }
  if (status < 400) return Promise.resolve(response)
  return Promise.reject(new AxiosError('falha', 'ERR_BAD_RESPONSE', config, null, response))
}

/** Instância Axios com adaptador falso e sessão controlada pelo teste. */
const setup = (handler: Handler) => {
  const http = axios.create({ adapter: handler })
  const state = {
    session: { userId: 'usr_alex', accessToken: 'at-1' } as { userId: string; accessToken: string } | null,
  }
  let refreshCalls = 0
  let invalidated = 0
  installSessionInterceptors(http, {
    current: () => state.session,
    refresh: async () => {
      refreshCalls += 1
      await new Promise((resolve) => setTimeout(resolve, 10))
      state.session = { userId: 'usr_alex', accessToken: 'at-2' }
      return 'at-2'
    },
    onSessionInvalid: () => {
      invalidated += 1
      state.session = null
    },
  })
  return { http, state, refreshCalls: () => refreshCalls, invalidated: () => invalidated }
}

test.describe('installSessionInterceptors', () => {
  test('token vencido: renova e repete a requisição com o novo token', async () => {
    const ctx = setup((config) =>
      config.headers.get('Authorization') === 'Bearer at-2'
        ? respond(config, 200, { ok: true })
        : respond(config, 401, { message: 'Renovar', reason: 'TOKEN_EXPIRED' }),
    )
    // A renovação única entre chamadas é coberta em session.spec.ts (RefreshSessionUseCase).
    const results = await Promise.all([ctx.http.get('/a'), ctx.http.get('/b')])
    expect(results.map((result) => result.status)).toEqual([200, 200])
    expect(ctx.refreshCalls()).toBeGreaterThanOrEqual(1)
  })

  test('401 definitivo encerra a sessão', async () => {
    const ctx = setup((config) => respond(config, 401, { message: 'Expirou', reason: 'SESSION_EXPIRED' }))
    await expect(ctx.http.get('/perfil')).rejects.toMatchObject({ code: 'UNAUTHENTICATED' })
    expect(ctx.invalidated()).toBe(1)
  })

  test('resposta de sessão que terminou durante a requisição é descartada', async () => {
    const ctx = setup(async (config) => {
      ctx.state.session = { userId: 'usr_bia', accessToken: 'at-bia' }
      return respond(config, 200, { dadosDaAlex: true })
    })
    await expect(ctx.http.get('/favoritos')).rejects.toMatchObject({ code: 'CANCELED' })
  })

  test('requisição anônima não é descartada quando alguém entra', async () => {
    const ctx = setup(async (config) => {
      ctx.state.session = { userId: 'usr_bia', accessToken: 'at-bia' }
      return respond(config, 200, { publico: true })
    })
    ctx.state.session = null
    await expect(ctx.http.get('/nfts')).resolves.toMatchObject({ status: 200 })
  })

  test('erros viram ApplicationError com mensagem pt-BR', async () => {
    const ctx = setup((config) => respond(config, 503, {}))
    await expect(ctx.http.get('/nfts')).rejects.toMatchObject({
      code: 'TRANSIENT',
      message: 'O serviço está instável no momento. Tente novamente',
    })
  })
})
