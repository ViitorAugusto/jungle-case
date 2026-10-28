import { expect, test } from '@playwright/test'

import type { Session } from '@domain/entities/session'

import { ApplicationError } from '@application/errors/application-error'
import type { AuthGateway } from '@application/ports/gateways/auth.gateway'
import { RefreshSessionUseCase } from '@application/use-cases/session/refresh-session.use-case'

import { MemorySessionStorage, sessionFor, signedIn } from './support/fakes'

const authWith = (refresh: () => Promise<Session>): AuthGateway & { calls: number } => {
  const gateway = {
    calls: 0,
    refresh: () => {
      gateway.calls += 1
      return refresh()
    },
    login: () => Promise.reject(new Error('não usado')),
    register: () => Promise.reject(new Error('não usado')),
    logout: () => Promise.resolve(),
    me: () => Promise.reject(new Error('não usado')),
  }
  return gateway
}

test.describe('RefreshSessionUseCase', () => {
  test('chamadas simultâneas compartilham uma única renovação', async () => {
    const state = signedIn('usr_alex')
    const auth = authWith(() => Promise.resolve({ ...sessionFor('usr_alex'), accessToken: 'at-novo' }))
    const refresh = new RefreshSessionUseCase(auth, state, new MemorySessionStorage())

    const results = await Promise.all([refresh.execute(), refresh.execute(), refresh.execute()])
    expect(auth.calls).toBe(1)
    expect(results.every((session) => session.accessToken === 'at-novo')).toBe(true)
    expect(state.current?.accessToken).toBe('at-novo')
  })

  test('refresh recusado expira a sessão local com o motivo', async () => {
    const state = signedIn('usr_alex')
    const storage = new MemorySessionStorage()
    storage.save(sessionFor('usr_alex'))
    const auth = authWith(() =>
      Promise.reject(new ApplicationError('UNAUTHENTICATED', 'Expirou', { reason: 'SESSION_EXPIRED' })),
    )
    await expect(new RefreshSessionUseCase(auth, state, storage).execute()).rejects.toMatchObject({
      code: 'UNAUTHENTICATED',
    })
    expect(state.getSnapshot()).toEqual({ session: null, endedReason: 'expired' })
    expect(storage.stored).toBeNull()
  })

  test('troca de usuário durante a renovação descarta o resultado', async () => {
    const state = signedIn('usr_alex')
    const auth = authWith(() => {
      state.set(sessionFor('usr_bia'))
      return Promise.resolve(sessionFor('usr_alex'))
    })
    await expect(
      new RefreshSessionUseCase(auth, state, new MemorySessionStorage()).execute(),
    ).rejects.toMatchObject({ code: 'CANCELED' })
    expect(state.current?.user.id).toBe('usr_bia')
  })
})
