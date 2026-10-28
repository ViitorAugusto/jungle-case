import { http, HttpResponse, type HttpHandler } from 'msw'

import { db } from '@mocks/db/database'
import { isEth } from '@mocks/db/eth'
import { standardEditionOf } from '@mocks/db/fixtures'
import { readJson } from '@mocks/http/respond'
import {
  parseScenarioId,
  scenarioDescriptions,
  scenarioIds,
  scenarios,
  type FailRule,
  type MockConfig,
} from '@mocks/scenarios/scenarios'
import { expireAllSessions } from '@mocks/services/auth'
import { cancelSettlements } from '@mocks/services/payments'
import { realtimeHub } from '@mocks/socket/realtime-hub'

/**
 * Controle dos mocks para testes e demonstração (nunca acionado pela UI do
 * produto). Mesma origem da app, interceptado pelo MSW: os testes chamam via
 * `fetch` dentro da página. Todas as respostas são JSON.
 */
type ConfigBody = Partial<Omit<MockConfig, 'activatedAt'>>

const nonNegative = (value: unknown) => (typeof value === 'number' && value >= 0 ? value : undefined)

const toConfig = (body: ConfigBody & { scenario?: unknown }): ConfigBody => {
  const scenario = parseScenarioId(body.scenario)
  const latencyMs = nonNegative(body.latencyMs)
  const paymentDelayMs = nonNegative(body.paymentDelayMs)
  const accessTokenTtlMs = nonNegative(body.accessTokenTtlMs)
  const seed = nonNegative(body.seed)
  return {
    ...(scenario ? { scenario } : {}),
    ...(latencyMs !== undefined ? { latencyMs } : {}),
    ...(paymentDelayMs !== undefined ? { paymentDelayMs } : {}),
    ...(accessTokenTtlMs !== undefined ? { accessTokenTtlMs } : {}),
    ...(seed !== undefined ? { seed } : {}),
  }
}

const badRequest = (message: string) => HttpResponse.json({ message }, { status: 400 })
const ok = (body: object = { ok: true }) => HttpResponse.json(body)

const control = (
  method: 'get' | 'post',
  path: string,
  resolver: (request: Request) => Promise<Response> | Response,
) => http[method](`*/__mock${path}`, ({ request }) => resolver(request))

export const controlHandlers: HttpHandler[] = [
  control('get', '/state', () =>
    ok({
      config: scenarios.config,
      connectionCount: realtimeHub.connectionCount(),
      lastEventId: realtimeHub.lastEventId(),
      scenarios: scenarioIds.map((id) => ({ id, description: scenarioDescriptions[id] })),
    }),
  ),

  /** Restaura banco e configuração; o cliente reconecta o socket sozinho. */
  control('post', '/reset', async (request) => {
    cancelSettlements()
    db.reset()
    realtimeHub.disconnectAll()
    return ok(scenarios.apply(toConfig(await readJson<ConfigBody>(request))))
  }),

  /** Troca o cenário e zera contadores (latência, gatilhos de uso único, falhas). */
  control('post', '/scenario', async (request) =>
    ok(scenarios.apply(toConfig(await readJson<ConfigBody>(request)))),
  ),

  control('post', '/fail', async (request) => {
    const body = await readJson<FailRule>(request)
    if (typeof body.path !== 'string' || typeof body.status !== 'number')
      return badRequest('Informe path e status')
    const rule: FailRule = {
      path: body.path,
      status: body.status,
      count: typeof body.count === 'number' && body.count > 0 ? body.count : 1,
      ...(body.method ? { method: body.method } : {}),
      ...(body.reason ? { reason: body.reason } : {}),
    }
    scenarios.failRules.push(rule)
    return ok({ rule })
  }),

  /** Muda preço e/ou estoque no banco e emite `nft.updated` (REST e evento coerentes). */
  control('post', '/events/nft-updated', async (request) => {
    const body = await readJson<{ nftId: string; editionId: string; priceEth: string; available: number }>(
      request,
    )
    const nft = body.nftId ? db.findNft(body.nftId) : undefined
    if (!nft) return badRequest('NFT inexistente')
    const editionId = body.editionId ?? standardEditionOf(nft)?.id
    if (!nft.editions.some((edition) => edition.id === editionId)) return badRequest('Edição inexistente')
    if (body.priceEth !== undefined && !isEth(body.priceEth))
      return badRequest('priceEth deve ser string decimal')
    if (body.available !== undefined && (!Number.isSafeInteger(body.available) || body.available < 0)) {
      return badRequest('available deve ser inteiro >= 0')
    }

    const updated = db.updateNft(nft.id, (current) => ({
      ...current,
      editions: current.editions.map((edition) =>
        edition.id === editionId
          ? {
              ...edition,
              ...(body.priceEth !== undefined ? { priceEth: body.priceEth } : {}),
              ...(body.available !== undefined ? { available: body.available } : {}),
            }
          : edition,
      ),
    }))
    if (!updated) return badRequest('NFT inexistente')
    db.commit()
    realtimeHub.nftUpdated(updated)
    return ok({ nft: updated, eventId: realtimeHub.lastEventId() })
  }),

  control('post', '/events/resend-last', () =>
    realtimeHub.resendLast()
      ? ok({ eventId: realtimeHub.lastEventId() })
      : badRequest('Nenhum evento emitido ainda'),
  ),

  control('post', '/events/stale', async (request) => {
    const body = await readJson<{ nftId: string; priceEth: string }>(request)
    const nft = body.nftId ? db.findNft(body.nftId) : undefined
    if (!nft) return badRequest('NFT inexistente')
    if (!body.priceEth || !isEth(body.priceEth)) return badRequest('priceEth deve ser string decimal')
    realtimeHub.sendStale(nft, body.priceEth)
    return ok()
  }),

  /** Derruba as conexões e recusa reconexão por `downForMs` (padrão 3 s). */
  control('post', '/socket/disconnect', async (request) => {
    const body = await readJson<{ downForMs: number }>(request)
    const downForMs = nonNegative(body.downForMs) ?? 3_000
    scenarios.socketDownUntil = Date.now() + downForMs
    realtimeHub.disconnectAll()
    return ok({ downUntil: new Date(scenarios.socketDownUntil).toISOString() })
  }),

  /** Revoga todas as sessões abertas (próxima chamada privada → 401 SESSION_EXPIRED). */
  control('post', '/sessions/expire', () => {
    expireAllSessions()
    db.commit()
    return ok()
  }),
]
