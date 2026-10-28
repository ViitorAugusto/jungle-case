import { expect, test } from '@playwright/test'

import type { Nft } from '@domain/entities/nft'
import type { NftUpdatedEvent } from '@domain/entities/realtime-event'

import { RealtimeEventFilter } from '@application/services/realtime-event-filter'
import { RealtimeSync } from '@application/services/realtime-sync'

import { FakeRealtimeGateway, RecordingSink } from './support/fakes'

const nft = (version: number): Nft => ({
  id: 'nft-001',
  name: 'Emerald Ape #042',
  description: '',
  collection: { id: 'arte-digital', name: 'Arte digital' },
  network: 'ethereum',
  creator: { name: 'Estúdio Norte', avatarUrl: '' },
  images: [],
  editions: [],
  featured: true,
  trendingScore: 71,
  createdAt: '2026-10-20T00:00:00.000Z',
  version,
})

const event = (eventId: string, version: number): NftUpdatedEvent => ({
  eventId,
  type: 'nft.updated',
  resource: { type: 'nft', id: 'nft-001' },
  version,
  occurredAt: '2026-10-27T12:00:00.000Z',
  payload: nft(version),
})

test.describe('RealtimeEventFilter', () => {
  test('ignora eventId repetido', () => {
    const filter = new RealtimeEventFilter()
    expect(filter.accept(event('evt_1', 2))).toBe(true)
    expect(filter.accept(event('evt_1', 2))).toBe(false)
  })

  test('ignora versão igual ou menor que a aplicada', () => {
    const filter = new RealtimeEventFilter()
    expect(filter.accept(event('evt_1', 3))).toBe(true)
    expect(filter.accept(event('evt_2', 2))).toBe(false)
    expect(filter.accept(event('evt_3', 3))).toBe(false)
    expect(filter.accept(event('evt_4', 4))).toBe(true)
  })
})

test.describe('RealtimeSync', () => {
  test('troca de sessão fecha a conexão anterior e ignora eventos atrasados dela', () => {
    const gateway = new FakeRealtimeGateway()
    const sink = new RecordingSink()
    const sync = new RealtimeSync(gateway, sink)

    sync.start('token-alex')
    const alex = gateway.connections[0]
    sync.start('token-bia')
    const bia = gateway.connections[1]

    expect(alex?.closed).toBe(true)
    alex?.listeners.onNftUpdated(event('evt_1', 2))
    expect(sink.applied).toEqual([])

    bia?.listeners.onNftUpdated(event('evt_2', 2))
    bia?.listeners.onNftUpdated(event('evt_2', 2))
    expect(sink.applied).toEqual([2])
  })

  test('reconexão aciona reconciliação por REST', () => {
    const gateway = new FakeRealtimeGateway()
    const sink = new RecordingSink()
    const sync = new RealtimeSync(gateway, sink)
    sync.start(null)
    gateway.connections[0]?.listeners.onReconnected()
    expect(sink.reconciled).toBe(1)
    sync.stop()
    gateway.connections[0]?.listeners.onReconnected()
    expect(sink.reconciled).toBe(1)
    expect(sync.getStatus()).toBe('idle')
  })
})
