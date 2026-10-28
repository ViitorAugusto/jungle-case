import type { Page } from '@playwright/test'

/** Cenários do servidor simulado (espelham `src/mocks/scenarios/scenarios.ts`). */
export type ScenarioId =
  | 'success'
  | 'empty'
  | 'latency-fixed'
  | 'latency-variable'
  | 'out-of-order'
  | 'offline'
  | 'server-error'
  | 'timeout'
  | 'session-expired'
  | 'unauthorized'
  | 'register-conflict'
  | 'validation-error'
  | 'coupon-invalid'
  | 'coupon-expired'
  | 'price-changed'
  | 'edition-sold-out'
  | 'order-timeout-after-create'
  | 'payment-confirmed'
  | 'payment-rejected'
  | 'wallet-rejected'
  | 'quote-outdated-on-order'

export type MockOptions = {
  scenario?: ScenarioId
  latencyMs?: number
  paymentDelayMs?: number
  accessTokenTtlMs?: number
  seed?: number
}

export type FailRule = {
  method?: string
  /** Trecho do caminho da API (ex.: `/favorites`). */
  path: string
  status: number
  reason?: string
  count: number
}

export type NftChange = {
  nftId: string
  editionId?: string
  priceEth?: string
  available?: number
}

export type MockConfig = Required<MockOptions> & { activatedAt: string }

export type MockState = {
  config: MockConfig
  connectionCount: number
  lastEventId: string | null
  scenarios: ScenarioId[]
}

const READY_TIMEOUT_MS = 15_000

/** Chave da configuração do servidor simulado (`src/mocks/scenarios/scenarios.ts`). */
const MOCK_CONFIG_KEY = 'nft-market:mock-config'
const SEEDED_FLAG = 'e2e:mock-config-seeded'

/**
 * Grava a configuração do cenário antes do bootstrap, uma única vez por aba:
 * reload e navegação seguintes mantêm o que o teste ou a app mudou depois.
 */
const seedConfig = ({ key, flag, config }: { key: string; flag: string; config: MockOptions }) => {
  if (window.sessionStorage.getItem(flag)) return
  window.localStorage.setItem(key, JSON.stringify(config))
  window.sessionStorage.setItem(flag, '1')
}

/**
 * Controle do servidor simulado a partir do teste: seleção e reset de cenário,
 * falhas programadas, latência e disparo de eventos Socket.IO. As chamadas
 * saem de dentro da página (`fetch` na mesma origem) porque só elas passam
 * pelo service worker do MSW.
 */
export class MockControl {
  private readonly page: Page

  constructor(page: Page) {
    this.page = page
  }

  /**
   * Abre `path` com o cenário aplicado. Cada teste roda em contexto novo, então
   * o banco simulado começa no cenário conhecido; a URL fica limpa (sem
   * parâmetros de mock), igual à de um usuário.
   */
  async open(path: string, options: MockOptions = {}): Promise<void> {
    if (Object.keys(options).length > 0) {
      await this.page.addInitScript(seedConfig, { key: MOCK_CONFIG_KEY, flag: SEEDED_FLAG, config: options })
    }
    await this.page.goto(path)
    await this.waitUntilReady()
  }

  /** Espera o worker do MSW iniciar (`<html data-mocks="ready">`). */
  async waitUntilReady(): Promise<void> {
    await this.page.waitForFunction(() => document.documentElement.dataset.mocks === 'ready', undefined, {
      timeout: READY_TIMEOUT_MS,
    })
  }

  /** Restaura banco e configuração; as conexões Socket.IO caem e o cliente reconecta. */
  reset(options: MockOptions = {}): Promise<MockConfig> {
    return this.query<MockConfig>('POST', '/reset', options)
  }

  setScenario(options: MockOptions): Promise<MockConfig> {
    return this.query<MockConfig>('POST', '/scenario', options)
  }

  /** Revoga todas as sessões: a próxima chamada privada responde 401 `SESSION_EXPIRED`. */
  expireSessions(): Promise<void> {
    return this.command('/sessions/expire')
  }

  /** As próximas `count` requisições que casam com a regra falham com `status`. */
  failNext(rule: FailRule): Promise<void> {
    return this.command('/fail', rule)
  }

  /** Altera o NFT no banco simulado e emite `nft.updated` com a nova versão. */
  updateNft(change: NftChange): Promise<void> {
    return this.command('/events/nft-updated', change)
  }

  /** Reenvia o último evento com o mesmo `eventId`. */
  resendLastEvent(): Promise<void> {
    return this.command('/events/resend-last')
  }

  /** Emite `nft.updated` com versão anterior à aplicada. */
  sendStaleNftEvent(nftId: string, priceEth: string): Promise<void> {
    return this.command('/events/stale', { nftId, priceEth })
  }

  /** Derruba as conexões Socket.IO e recusa reconexão por `downForMs`. */
  disconnectSocket(downForMs = 3_000): Promise<void> {
    return this.command('/socket/disconnect', { downForMs })
  }

  state(): Promise<MockState> {
    return this.query<MockState>('GET', '/state')
  }

  private async command(path: string, body?: unknown): Promise<void> {
    await this.request('POST', path, body)
  }

  private async query<T>(method: 'GET' | 'POST', path: string, body?: unknown): Promise<T> {
    return JSON.parse(await this.request(method, path, body)) as T
  }

  private async request(method: 'GET' | 'POST', path: string, body?: unknown): Promise<string> {
    // Depois de um `page.goto` o worker ainda pode não interceptar: o fetch cairia no index.html.
    await this.waitUntilReady()
    const result = await this.page.evaluate(
      async ({ method, url, body }) => {
        const response = await fetch(url, {
          method,
          headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
          body: body === undefined ? undefined : JSON.stringify(body),
        })
        const text = await response.text()
        return { ok: response.ok, status: response.status, text }
      },
      { method, url: `/__mock${path}`, body },
    )
    if (!result.ok)
      throw new Error(`Controle do mock ${method} ${path} falhou (${result.status}): ${result.text}`)
    return result.text
  }
}
