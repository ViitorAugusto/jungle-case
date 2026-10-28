import type { Cart } from '@domain/entities/cart'
import type { Nft } from '@domain/entities/nft'
import type { Order } from '@domain/entities/order'
import type { Receipt } from '@domain/entities/receipt'
import type { Session } from '@domain/entities/session'

import { ApplicationError } from '@application/errors/application-error'
import type { AuthGateway } from '@application/ports/gateways/auth.gateway'
import type { CartGateway } from '@application/ports/gateways/cart.gateway'
import type { CreateOrderPayload, OrderGateway } from '@application/ports/gateways/order.gateway'
import type { RealtimeGateway, RealtimeListeners } from '@application/ports/gateways/realtime.gateway'
import type {
  CheckoutAttempt,
  CheckoutAttemptStorage,
} from '@application/ports/services/checkout-attempt-storage'
import type { Clock } from '@application/ports/services/clock'
import type { GuestCartStorage } from '@application/ports/services/guest-cart-storage'
import type { IdGenerator } from '@application/ports/services/id-generator'
import type { RealtimeSink } from '@application/ports/services/realtime-sink'
import type { SessionStorage } from '@application/ports/services/session-storage'
import { SessionState } from '@application/services/session-state'

export const fixedClock = (iso = '2026-10-27T12:00:00.000Z'): Clock => ({ now: () => new Date(iso) })

export const sequentialIds = (prefix = 'key'): IdGenerator => {
  let next = 0
  return { uuid: () => `${prefix}-${++next}` }
}

export const sessionFor = (userId: string): Session => ({
  user: { id: userId, name: userId, email: `${userId}@teste.dev`, avatarUrl: null },
  accessToken: `at-${userId}`,
  refreshToken: `rt-${userId}`,
  accessExpiresAt: '2099-01-01T00:00:00.000Z',
  refreshExpiresAt: '2099-01-01T00:00:00.000Z',
})

export const signedIn = (userId = 'usr_1') => {
  const state = new SessionState()
  state.set(sessionFor(userId))
  return state
}

export class InMemoryCheckoutAttempts implements CheckoutAttemptStorage {
  readonly attempts = new Map<string, CheckoutAttempt>()

  load(userId: string) {
    return this.attempts.get(userId) ?? null
  }

  save(userId: string, attempt: CheckoutAttempt) {
    this.attempts.set(userId, attempt)
  }

  clear(userId: string) {
    this.attempts.delete(userId)
  }
}

export const orderFixture = (overrides: Partial<Order> = {}): Order => ({
  id: 'ord_1',
  status: 'pending',
  version: 1,
  lines: [],
  coupon: null,
  summary: { subtotalEth: '1', discountEth: '0', networkFeeEth: '0.01', totalEth: '1.01' },
  collector: {
    displayName: 'Alex Rocha',
    username: 'alex',
    profileName: 'Alex Rocha',
    email: 'alex@teste.dev',
    ensName: 'alexrocha.eth',
    referralCode: 'JNG-2026',
    note: null,
  },
  payment: {
    network: 'ethereum',
    address: '0x1111111111111111111111111111111111111111',
    secondaryAddressOrEns: null,
    provider: 'metamask',
    walletId: 'primary',
  },
  transaction: null,
  rejectionReason: null,
  createdAt: '2026-10-27T12:00:00.000Z',
  updatedAt: '2026-10-27T12:00:00.000Z',
  ...overrides,
})

/**
 * Servidor de pedidos em memória com a mesma regra de idempotência da API:
 * mesma chave + mesmo conteúdo devolve o pedido; conteúdo diferente → CONFLICT.
 * `failNextCreate` simula falhas (ex.: timeout depois de criar).
 */
export class InMemoryOrderGateway implements OrderGateway {
  readonly orders = new Map<string, Order>()
  readonly byKey = new Map<string, { payload: string; orderId: string }>()
  createCalls = 0
  failNextCreate: { error: ApplicationError; afterCreating: boolean } | null = null

  create(payload: CreateOrderPayload, idempotencyKey: string): Promise<Order> {
    this.createCalls += 1
    const serialized = JSON.stringify(payload)
    const known = this.byKey.get(idempotencyKey)
    if (known) {
      if (known.payload !== serialized) {
        return Promise.reject(
          new ApplicationError('CONFLICT', 'Chave reutilizada', { reason: 'IDEMPOTENCY_KEY_REUSED' }),
        )
      }
      return Promise.resolve(this.orders.get(known.orderId) as Order)
    }

    const failure = this.failNextCreate
    this.failNextCreate = null
    if (failure && !failure.afterCreating) return Promise.reject(failure.error)

    const order = orderFixture({
      id: `ord_${this.orders.size + 1}`,
      collector: payload.collector,
      payment: payload.payment,
    })
    this.orders.set(order.id, order)
    this.byKey.set(idempotencyKey, { payload: serialized, orderId: order.id })
    return failure ? Promise.reject(failure.error) : Promise.resolve(order)
  }

  findById(id: string): Promise<Order> {
    const order = this.orders.get(id)
    return order
      ? Promise.resolve(order)
      : Promise.reject(
          new ApplicationError('NOT_FOUND', 'Pedido não encontrado', { reason: 'ORDER_NOT_FOUND' }),
        )
  }

  receipt(): Promise<Receipt> {
    return Promise.reject(new ApplicationError('CONFLICT', 'Sem recibo'))
  }

  settle(id: string, status: Order['status']) {
    const order = this.orders.get(id)
    if (order) this.orders.set(id, { ...order, status, version: order.version + 1 })
  }
}

export class MemorySessionStorage implements SessionStorage {
  stored: Session | null = null
  load() {
    return this.stored
  }
  save(session: Session) {
    this.stored = session
  }
  clear() {
    this.stored = null
  }
}

/** Gateway falso: guarda os listeners de cada conexão e registra fechamentos. */
export class FakeRealtimeGateway implements RealtimeGateway {
  readonly connections: { token: string | null; listeners: RealtimeListeners; closed: boolean }[] = []

  connect(accessToken: string | null, listeners: RealtimeListeners) {
    const connection = { token: accessToken, listeners, closed: false }
    this.connections.push(connection)
    return {
      close: () => {
        connection.closed = true
      },
    }
  }
}

export class RecordingSink implements RealtimeSink {
  readonly applied: number[] = []
  reconciled = 0
  applyNft(item: Nft) {
    this.applied.push(item.version)
  }
  applyOrder() {}
  reconcile() {
    this.reconciled += 1
  }
}

export const emptyCart = (owner: Cart['owner'] = 'user'): Cart => ({
  owner,
  lines: [],
  coupon: null,
  summary: { subtotalEth: '0', discountEth: '0', networkFeeEth: '0', totalEth: '0' },
  itemCount: 0,
  version: 1,
})

/** Carrinho que só registra as chamadas; `failMerge` simula falha na mescla. */
export class RecordingCartGateway implements CartGateway {
  readonly added: { nftId: string; editionId: string; quantity: number }[] = []
  readonly updated: { lineId: string; quantity: number }[] = []
  readonly merged: string[] = []
  failMerge: Error | null = null

  get() {
    return Promise.resolve(emptyCart())
  }
  addItem(input: { nftId: string; editionId: string; quantity: number }) {
    this.added.push(input)
    return Promise.resolve(emptyCart())
  }
  updateItem(lineId: string, quantity: number) {
    this.updated.push({ lineId, quantity })
    return Promise.resolve(emptyCart())
  }
  removeItem() {
    return Promise.resolve(emptyCart())
  }
  applyCoupon() {
    return Promise.resolve(emptyCart())
  }
  removeCoupon() {
    return Promise.resolve(emptyCart())
  }
  mergeGuestCart(guestCartId: string) {
    this.merged.push(guestCartId)
    return this.failMerge ? Promise.reject(this.failMerge) : Promise.resolve(emptyCart())
  }
}

export class MemoryGuestCart implements GuestCartStorage {
  id: string | null
  constructor(id: string | null = null) {
    this.id = id
  }
  load() {
    return this.id
  }
  getOrCreate() {
    this.id ??= 'guest-1'
    return this.id
  }
  clear() {
    this.id = null
  }
}

/** Autenticação falsa: `login` aceita só a senha informada; registra logouts. */
export class FakeAuthGateway implements AuthGateway {
  readonly logins: { email: string; password: string }[] = []
  logoutCalls = 0
  failLogout: Error | null = null
  private readonly password: string

  constructor(password = 'Senha@123') {
    this.password = password
  }

  login(email: string, password: string) {
    this.logins.push({ email, password })
    return password === this.password
      ? Promise.resolve(sessionFor(email.split('@')[0] ?? email))
      : Promise.reject(
          new ApplicationError('UNAUTHENTICATED', 'E-mail ou senha inválidos', {
            reason: 'INVALID_CREDENTIALS',
          }),
        )
  }
  register() {
    return Promise.reject(new Error('não usado'))
  }
  refresh() {
    return Promise.reject(new Error('não usado'))
  }
  logout() {
    this.logoutCalls += 1
    return this.failLogout ? Promise.reject(this.failLogout) : Promise.resolve()
  }
  me() {
    return Promise.reject(new Error('não usado'))
  }
}
