import { delay, http, HttpResponse, type HttpHandler } from 'msw'

import type { ApiErrorBody } from '@adapters/http/contracts'

import { settleDueOrders } from '@mocks/services/payments'
import { db } from '@mocks/db/database'
import { HANG_MS, scenarios } from '@mocks/scenarios/scenarios'

/** Falha de negócio do servidor simulado, convertida no corpo de erro padrão. */
export class ApiError extends Error {
  readonly status: number
  readonly reason: string
  readonly fieldErrors: Record<string, string[]> | undefined

  constructor(status: number, reason: string, message: string, fieldErrors?: Record<string, string[]>) {
    super(message)
    this.status = status
    this.reason = reason
    this.fieldErrors = fieldErrors
  }
}

export const validationError = (fieldErrors: Record<string, string[]>) =>
  new ApiError(422, 'VALIDATION_FAILED', 'Revise os campos destacados', fieldErrors)

export const errorResponse = (
  status: number,
  reason: string,
  message: string,
  fieldErrors?: Record<string, string[]>,
) => HttpResponse.json<ApiErrorBody>({ message, reason, ...(fieldErrors ? { fieldErrors } : {}) }, { status })

export const readJson = async <T>(request: Request): Promise<Partial<T>> => {
  try {
    return (await request.json()) as Partial<T>
  } catch {
    return {}
  }
}

type Method = 'get' | 'post' | 'put' | 'patch' | 'delete'
type Resolver = (info: { request: Request; params: Record<string, string> }) => Response | Promise<Response>

const CATALOG_PATH = /\/api\/nfts(\/|$|\?)/
const CATALOG_LIST_PATH = /\/api\/nfts\/?$/

/**
 * Registra um endpoint da API simulada aplicando, nesta ordem: liquidação de
 * pagamentos vencidos, condições de rede (offline, timeout, 503 no catálogo),
 * falhas programadas, o próprio endpoint e tradução de `ApiError`; a latência
 * do cenário vem por último. O estado é lido quando a requisição chega: uma
 * mudança feita enquanto a resposta "viaja" não aparece nela (cenários
 * determinísticos, como um servidor que já processou o pedido).
 */
export const route = (method: Method, path: string, resolver: Resolver): HttpHandler =>
  http[method](`*/api${path}`, async ({ request, params }) => {
    const url = new URL(request.url)
    const isCatalog = request.method === 'GET' && CATALOG_PATH.test(url.pathname)
    const response = await handle(request, url, isCatalog, params, resolver)
    await delay(scenarios.latencyFor(isCatalog && CATALOG_LIST_PATH.test(url.pathname)))
    return response
  })

const handle = async (
  request: Request,
  url: URL,
  isCatalog: boolean,
  params: Record<string, string | readonly string[] | undefined>,
  resolver: Resolver,
): Promise<Response> => {
  settleDueOrders()

  if (scenarios.is('offline')) return HttpResponse.error()
  if (isCatalog && scenarios.is('timeout')) {
    await delay(HANG_MS)
    return errorResponse(504, 'SERVICE_UNAVAILABLE', 'O servidor demorou para responder')
  }
  if (isCatalog && scenarios.is('server-error')) {
    return errorResponse(503, 'SERVICE_UNAVAILABLE', 'Catálogo indisponível no momento. Tente novamente')
  }
  const failure = scenarios.takeFailRule(request.method, url.pathname)
  if (failure) {
    return errorResponse(
      failure.status,
      failure.reason ?? 'SIMULATED_FAILURE',
      'Falha simulada pelo cenário de teste',
    )
  }

  try {
    const stringParams = Object.fromEntries(
      Object.entries(params).map(([key, value]) => [
        key,
        Array.isArray(value) ? (value[0] ?? '') : (value ?? ''),
      ]),
    )
    return await resolver({ request, params: stringParams })
  } catch (error) {
    if (error instanceof ApiError)
      return errorResponse(error.status, error.reason, error.message, error.fieldErrors)
    throw error
  }
}

/** Persiste o estado e devolve JSON. */
export const commitJson = (body: object, init?: ResponseInit) => {
  db.commit()
  return HttpResponse.json(body, init)
}

export const commitEmpty = () => {
  db.commit()
  return new HttpResponse(null, { status: 204 })
}
