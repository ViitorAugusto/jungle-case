import { expect, test } from '@playwright/test'

import { ApplicationError } from '@application/errors/application-error'
import { PlaceOrderUseCase } from '@application/use-cases/checkout/place-order.use-case'
import { ResumeCheckoutUseCase } from '@application/use-cases/checkout/resume-checkout.use-case'

import {
  fixedClock,
  InMemoryCheckoutAttempts,
  InMemoryOrderGateway,
  sequentialIds,
  signedIn,
} from './support/fakes'

const input = {
  quoteId: 'qte_1',
  collector: {
    displayName: 'Alex Rocha',
    username: 'alex',
    profileName: 'Alex Rocha',
    email: 'alex@teste.dev',
    ensName: 'alexrocha.eth',
    referralCode: 'JNG-2026',
    note: '',
  },
  payment: {
    network: 'ethereum',
    address: '0x1111111111111111111111111111111111111111',
    secondaryAddressOrEns: '',
    provider: 'metamask',
    walletId: 'primary',
  },
}

/** Conteúdo normalizado que o caso de uso envia para `input`. */
const payload = {
  ...input,
  collector: { ...input.collector, note: null },
  payment: { ...input.payment, network: 'ethereum', provider: 'metamask', secondaryAddressOrEns: null },
} as const

const setup = () => {
  const orders = new InMemoryOrderGateway()
  const attempts = new InMemoryCheckoutAttempts()
  const session = signedIn('usr_1')
  const placeOrder = new PlaceOrderUseCase(orders, attempts, session, sequentialIds(), fixedClock())
  const resume = new ResumeCheckoutUseCase(orders, attempts, session)
  return { orders, attempts, placeOrder, resume }
}

test.describe('PlaceOrderUseCase', () => {
  test('clique repetido usa a mesma chave e devolve o mesmo pedido', async () => {
    const { orders, placeOrder } = setup()
    const [first, second] = await Promise.all([placeOrder.execute(input), placeOrder.execute(input)])
    expect(first.id).toBe(second.id)
    expect(orders.orders.size).toBe(1)
  })

  test('timeout depois de criar: reenvio com a mesma chave recupera o pedido', async () => {
    const { orders, attempts, placeOrder } = setup()
    orders.failNextCreate = { error: new ApplicationError('TIMEOUT', 'Tempo esgotado'), afterCreating: true }

    await expect(placeOrder.execute(input)).rejects.toMatchObject({ code: 'TIMEOUT' })
    const keyAfterTimeout = attempts.load('usr_1')?.idempotencyKey
    expect(keyAfterTimeout).toBeDefined()

    const recovered = await placeOrder.execute(input)
    expect(orders.orders.size).toBe(1)
    expect(recovered.id).toBe('ord_1')
    expect(attempts.load('usr_1')?.idempotencyKey).toBe(keyAfterTimeout)
  })

  test('timeout e depois conteúdo diferente: reenvia a tentativa antiga antes de criar outra', async () => {
    const { orders, placeOrder } = setup()
    orders.failNextCreate = { error: new ApplicationError('TIMEOUT', 'Tempo esgotado'), afterCreating: true }
    await expect(placeOrder.execute(input)).rejects.toMatchObject({ code: 'TIMEOUT' })

    const changed = await placeOrder.execute({ ...input, quoteId: 'qte_2' })
    expect(changed.id).toBe('ord_1')
    expect(orders.orders.size).toBe(1)
  })

  test('com pedido pendente, nova tentativa devolve o pendente em vez de criar outro', async () => {
    const { orders, placeOrder } = setup()
    const pending = await placeOrder.execute(input)
    const again = await placeOrder.execute({
      ...input,
      collector: { ...input.collector, displayName: 'Alex R.' },
    })
    expect(again.id).toBe(pending.id)
    expect(orders.orders.size).toBe(1)
  })

  test('depois de pedido recusado, nova compra usa chave nova', async () => {
    const { orders, attempts, placeOrder } = setup()
    const rejected = await placeOrder.execute(input)
    const firstKey = attempts.load('usr_1')?.idempotencyKey
    orders.settle(rejected.id, 'rejected')

    const next = await placeOrder.execute({ ...input, quoteId: 'qte_2' })
    expect(next.id).not.toBe(rejected.id)
    expect(attempts.load('usr_1')?.idempotencyKey).not.toBe(firstKey)
  })

  test('conflito que prova que o pedido não existe descarta a tentativa', async () => {
    const { orders, attempts, placeOrder } = setup()
    orders.failNextCreate = {
      error: new ApplicationError('CONFLICT', 'Cotação desatualizada', { reason: 'QUOTE_OUTDATED' }),
      afterCreating: false,
    }
    await expect(placeOrder.execute(input)).rejects.toMatchObject({ reason: 'QUOTE_OUTDATED' })
    expect(attempts.load('usr_1')).toBeNull()
  })

  test('tentativa apontando para pedido que não existe mais segue com compra nova', async () => {
    const { attempts, placeOrder } = setup()
    attempts.save('usr_1', {
      idempotencyKey: 'velha',
      payload,
      orderId: 'ord_inexistente',
      startedAt: '2026-10-27T11:00:00.000Z',
    })
    const order = await placeOrder.execute(input)
    expect(order.status).toBe('pending')
  })

  test('valida colecionador e pagamento campo a campo antes de ir à rede', async () => {
    const { orders, placeOrder } = setup()
    const error = await placeOrder
      .execute({
        ...input,
        collector: { ...input.collector, email: 'invalido', ensName: 'alex', referralCode: 'x' },
        payment: { ...input.payment, network: 'solana', provider: 'phantom' },
      })
      .catch((caught: unknown) => caught)
    expect(error).toMatchObject({ code: 'VALIDATION' })
    expect(Object.keys((error as ApplicationError).fieldErrors).sort()).toEqual([
      'collector.email',
      'collector.ensName',
      'collector.referralCode',
      'payment.address',
      'payment.provider',
    ])
    expect(orders.createCalls).toBe(0)
  })

  test('envia o conteúdo normalizado (observação e ENS secundário vazios viram null)', async () => {
    const { orders, placeOrder } = setup()
    await placeOrder.execute({ ...input, collector: { ...input.collector, ensName: ' AlexRocha.ETH ' } })
    expect([...orders.orders.values()][0]?.collector).toMatchObject({ ensName: 'alexrocha.eth', note: null })
  })
})

test.describe('ResumeCheckoutUseCase', () => {
  test('após refresh recupera o pedido pendente sem criar outro', async () => {
    const { orders, placeOrder, resume } = setup()
    const placed = await placeOrder.execute(input)
    const resumed = await resume.execute()
    expect(resumed?.id).toBe(placed.id)
    expect(orders.orders.size).toBe(1)
  })

  test('pedido final limpa a tentativa', async () => {
    const { orders, attempts, placeOrder, resume } = setup()
    const placed = await placeOrder.execute(input)
    orders.settle(placed.id, 'confirmed')
    expect((await resume.execute())?.status).toBe('confirmed')
    expect(attempts.load('usr_1')).toBeNull()
  })
})
