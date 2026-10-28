import { QueryClient } from '@tanstack/react-query'
import { expect, test } from '@playwright/test'

import { SessionState } from '@application/services/session-state'
import { RealtimeSync } from '@application/services/realtime-sync'
import { MergeGuestCartUseCase } from '@application/use-cases/cart/merge-guest-cart.use-case'
import { LoginUseCase } from '@application/use-cases/session/login.use-case'
import { LogoutUseCase } from '@application/use-cases/session/logout.use-case'

import { startSessionRuntime } from '@main/session/session-runtime'

import {
  FakeAuthGateway,
  FakeRealtimeGateway,
  MemoryGuestCart,
  MemorySessionStorage,
  RecordingCartGateway,
  RecordingSink,
  sessionFor,
} from './support/fakes'

const PASSWORD = 'Senha@123'

const setup = (guestCartId: string | null = null) => {
  const auth = new FakeAuthGateway(PASSWORD)
  const state = new SessionState()
  const storage = new MemorySessionStorage()
  const cart = new RecordingCartGateway()
  const guestCart = new MemoryGuestCart(guestCartId)
  const login = new LoginUseCase(auth, state, storage, new MergeGuestCartUseCase(cart, guestCart))
  const logout = new LogoutUseCase(auth, state, storage)
  return { auth, state, storage, cart, guestCart, login, logout }
}

test.describe('LoginUseCase', () => {
  test('autentica, persiste a sessão e mescla o carrinho do visitante', async () => {
    const { state, storage, cart, guestCart, login } = setup('guest-abc')

    const session = await login.execute({ email: '  Alex@Jungle.TEST ', password: PASSWORD })

    expect(session.user.id).toBe('alex')
    expect(state.current).toEqual(session)
    expect(storage.stored).toEqual(session)
    expect(cart.merged).toEqual(['guest-abc'])
    expect(guestCart.load()).toBeNull()
  })

  test('normaliza o e-mail antes de enviar', async () => {
    const { auth, login } = setup()

    await login.execute({ email: '  Alex@Jungle.TEST ', password: PASSWORD })

    expect(auth.logins).toEqual([{ email: 'alex@jungle.test', password: PASSWORD }])
  })

  test('campos inválidos são barrados antes da rede', async () => {
    const { auth, login } = setup()

    await expect(login.execute({ email: 'sem-arroba', password: '' })).rejects.toMatchObject({
      code: 'VALIDATION',
      fieldErrors: { email: expect.any(Array) as unknown, password: ['Informe a senha'] },
    })
    expect(auth.logins).toEqual([])
  })

  test('credencial recusada não cria sessão nem mescla carrinho', async () => {
    const { state, storage, cart, guestCart, login } = setup('guest-abc')

    await expect(login.execute({ email: 'alex@jungle.test', password: 'errada' })).rejects.toMatchObject({
      code: 'UNAUTHENTICATED',
    })
    expect(state.current).toBeNull()
    expect(storage.stored).toBeNull()
    expect(cart.merged).toEqual([])
    expect(guestCart.load()).toBe('guest-abc')
  })
})

test.describe('LogoutUseCase', () => {
  test('encerra a sessão local e no servidor', async () => {
    const { auth, state, storage, login, logout } = setup()
    await login.execute({ email: 'alex@jungle.test', password: PASSWORD })

    await logout.execute()

    expect(auth.logoutCalls).toBe(1)
    expect(state.current).toBeNull()
    expect(state.getSnapshot().endedReason).toBe('logout')
    expect(storage.stored).toBeNull()
  })

  test('falha da API não deixa o usuário preso logado', async () => {
    const { auth, state, storage, login, logout } = setup()
    await login.execute({ email: 'alex@jungle.test', password: PASSWORD })
    auth.failLogout = new Error('rede')

    await logout.execute()

    expect(state.current).toBeNull()
    expect(storage.stored).toBeNull()
  })

  test('sem sessão não chama a API', async () => {
    const { auth, logout } = setup()

    await logout.execute()

    expect(auth.logoutCalls).toBe(0)
  })
})

test.describe('limpeza na troca de usuário (R35, R62)', () => {
  const privateKey = (userId: string) => ['private', userId, 'favorites']
  const publicKey = ['nfts', 'list']
  const guestKey = ['guest', 'cart']

  const runtimeFor = (state: SessionState) => {
    const queryClient = new QueryClient()
    const gateway = new FakeRealtimeGateway()
    const realtime = new RealtimeSync(gateway, new RecordingSink())
    const stop = startSessionRuntime({ sessionState: state, queryClient, realtime })
    return { queryClient, gateway, stop }
  }

  test('logout remove cache privado e do visitante, fecha o socket e abre um anônimo', async () => {
    const { state, login, logout } = setup()
    await login.execute({ email: 'alex@jungle.test', password: PASSWORD })
    const { queryClient, gateway, stop } = runtimeFor(state)
    queryClient.setQueryData(privateKey('alex'), ['nft-002'])
    queryClient.setQueryData(guestKey, { lines: [] })
    queryClient.setQueryData(publicKey, ['nft-001'])

    await logout.execute()

    expect(queryClient.getQueryData(privateKey('alex'))).toBeUndefined()
    expect(queryClient.getQueryData(guestKey)).toBeUndefined()
    expect(queryClient.getQueryData(publicKey)).toEqual(['nft-001'])
    expect(gateway.connections.map(({ token, closed }) => ({ token, closed }))).toEqual([
      { token: 'at-alex', closed: true },
      { token: null, closed: false },
    ])
    stop()
  })

  test('troca direta de usuário não deixa cache do anterior', () => {
    const state = new SessionState()
    state.set(sessionFor('alex'))
    const { queryClient, gateway, stop } = runtimeFor(state)
    queryClient.setQueryData(privateKey('alex'), ['nft-002'])

    state.set(sessionFor('bia'))

    expect(queryClient.getQueryData(privateKey('alex'))).toBeUndefined()
    expect(gateway.connections.at(0)?.closed).toBe(true)
    expect(gateway.connections.at(-1)?.token).toBe('at-bia')
    stop()
  })

  test('renovação de token do mesmo usuário preserva cache e conexão', () => {
    const state = new SessionState()
    state.set(sessionFor('alex'))
    const { queryClient, gateway, stop } = runtimeFor(state)
    queryClient.setQueryData(privateKey('alex'), ['nft-002'])

    state.set({ ...sessionFor('alex'), accessToken: 'at-renovado' })

    expect(queryClient.getQueryData(privateKey('alex'))).toEqual(['nft-002'])
    expect(gateway.connections).toHaveLength(1)
    expect(gateway.connections.at(0)?.closed).toBe(false)
    stop()
  })
})
