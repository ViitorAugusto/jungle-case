/**
 * Cenários determinísticos do servidor simulado. Selecionados por parâmetro
 * de URL (`?scenario=`) ou pelos endpoints de controle `/__mock/*`; ficam
 * guardados no navegador até serem trocados ou resetados.
 */
export const scenarioIds = [
  'success',
  'empty',
  'latency-fixed',
  'latency-variable',
  'out-of-order',
  'offline',
  'server-error',
  'timeout',
  'session-expired',
  'unauthorized',
  'register-conflict',
  'validation-error',
  'coupon-invalid',
  'coupon-expired',
  'price-changed',
  'edition-sold-out',
  'quote-outdated-on-order',
  'order-timeout-after-create',
  'payment-confirmed',
  'payment-rejected',
  'wallet-rejected',
] as const

export type ScenarioId = (typeof scenarioIds)[number]

export const scenarioDescriptions: Record<ScenarioId, string> = {
  success: 'Tudo funciona com latência baixa',
  empty: 'Catálogo vazio',
  'latency-fixed': 'Todas as respostas levam 1,5 s',
  'latency-variable': 'Latência entre 0,2 s e 2 s, sequência fixa por semente',
  'out-of-order': 'Listagem alterna resposta lenta e rápida: a anterior chega depois da nova',
  offline: 'Sem conexão (REST e Socket.IO)',
  'server-error': 'Catálogo responde 503',
  timeout: 'Catálogo não responde até o cliente esgotar o tempo',
  'session-expired': 'Sessões abertas antes da ativação expiram (sem renovação)',
  unauthorized: 'Recursos privados respondem 403',
  'register-conflict': 'Cadastro sempre responde e-mail em uso (409)',
  'validation-error': 'Cadastro, perfil, senha e carteiras respondem 422',
  'coupon-invalid': 'Qualquer cupom é inválido',
  'coupon-expired': 'Qualquer cupom está expirado',
  'price-changed': 'Logo após a cotação, o preço do primeiro item sobe 10% (evento nft.updated)',
  'edition-sold-out': 'Ao enviar o pedido, a edição do primeiro item esgota (409)',
  'quote-outdated-on-order':
    'Ao enviar o primeiro pedido, o preço do primeiro item sobe 10% sem evento: o servidor recusa a cotação (409 QUOTE_OUTDATED)',
  'order-timeout-after-create':
    'O primeiro pedido é criado, mas a resposta não chega (timeout); o reenvio recupera',
  'payment-confirmed': 'Pagamento confirmado',
  'payment-rejected': 'Pagamento recusado',
  'wallet-rejected': 'Conexão de carteira recusada',
}

export type FailRule = {
  method?: string
  /** Trecho do caminho (ex.: `/favorites`). */
  path: string
  status: number
  reason?: string
  /** Quantas requisições falham antes de voltar ao normal. */
  count: number
}

export type MockConfig = {
  scenario: ScenarioId
  /** Momento de ativação (sessões anteriores expiram em `session-expired`). */
  activatedAt: string
  latencyMs: number
  paymentDelayMs: number
  accessTokenTtlMs: number
  seed: number
}

export const DEFAULT_CONFIG: Omit<MockConfig, 'activatedAt'> = {
  scenario: 'success',
  latencyMs: 120,
  paymentDelayMs: 2_000,
  accessTokenTtlMs: 15 * 60_000,
  seed: 42,
}

/** Tempo de espera do cenário de timeout: maior que o limite do cliente (10 s). */
export const HANG_MS = 15_000

const STORAGE_KEY = 'nft-market:mock-config'

const loadConfig = (): MockConfig => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw)
      return {
        ...DEFAULT_CONFIG,
        activatedAt: new Date().toISOString(),
        ...(JSON.parse(raw) as Partial<MockConfig>),
      }
  } catch {
    // Configuração inválida: padrão.
  }
  return { ...DEFAULT_CONFIG, activatedAt: new Date().toISOString() }
}

/** PRNG determinístico (mulberry32): mesma semente, mesma sequência de latências. */
const createRandom = (seed: number) => {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4_294_967_296
  }
}

export const scenarios = {
  config: loadConfig(),
  failRules: [] as FailRule[],
  /** Gatilhos de uso único já disparados nesta ativação (ex.: `price-changed`). */
  fired: new Set<string>(),
  /** Socket.IO recusa conexões até este instante (simulação de queda). */
  socketDownUntil: 0,
  requestCount: 0,
  random: createRandom(DEFAULT_CONFIG.seed),

  is(id: ScenarioId): boolean {
    return this.config.scenario === id
  },

  /** Aplica cenário e parâmetros, zerando contadores para reproduzir a sequência desde o início. */
  apply(changes: Partial<Omit<MockConfig, 'activatedAt'>>): MockConfig {
    this.config = { ...DEFAULT_CONFIG, ...changes, activatedAt: new Date().toISOString() }
    this.failRules = []
    this.fired.clear()
    this.socketDownUntil = 0
    this.requestCount = 0
    this.random = createRandom(this.config.seed)
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(this.config))
    } catch {
      // Sem persistência, vale só nesta página.
    }
    return this.config
  },

  /** Dispara uma vez por ativação; devolve `true` só na primeira chamada. */
  once(trigger: string): boolean {
    if (this.fired.has(trigger)) return false
    this.fired.add(trigger)
    return true
  },

  /** Latência da requisição conforme o cenário (determinística). */
  latencyFor(isCatalogList: boolean): number {
    this.requestCount += 1
    if (this.is('latency-fixed')) return 1_500
    if (this.is('latency-variable')) return 200 + Math.round(this.random() * 1_800)
    if (this.is('out-of-order') && isCatalogList) return this.requestCount % 2 === 1 ? 1_800 : 200
    return this.config.latencyMs
  },

  takeFailRule(method: string, path: string): FailRule | undefined {
    const rule = this.failRules.find(
      (candidate) =>
        candidate.count > 0 &&
        path.includes(candidate.path) &&
        (!candidate.method || candidate.method.toUpperCase() === method.toUpperCase()),
    )
    if (rule) rule.count -= 1
    return rule
  },
}

const isScenarioId = (value: string): value is ScenarioId =>
  (scenarioIds as readonly string[]).includes(value)

const numberParam = (params: URLSearchParams, key: string) => {
  const value = Number(params.get(key))
  return params.has(key) && Number.isFinite(value) && value >= 0 ? value : undefined
}

/**
 * Lê `?scenario=`, `?latency=`, `?paymentDelay=`, `?accessTtl=` e `?seed=` da URL
 * da página. Devolve `true` quando `?mockReset=1` pede reset do banco simulado.
 */
export const applyScenarioFromUrl = (search: string): boolean => {
  const params = new URLSearchParams(search)
  const scenario = params.get('scenario')
  const latencyMs = numberParam(params, 'latency')
  const paymentDelayMs = numberParam(params, 'paymentDelay')
  const accessTokenTtlMs = numberParam(params, 'accessTtl')
  const seed = numberParam(params, 'seed')
  const hasChanges = [latencyMs, paymentDelayMs, accessTokenTtlMs, seed].some((value) => value !== undefined)

  if ((scenario && isScenarioId(scenario)) || hasChanges) {
    scenarios.apply({
      scenario: scenario && isScenarioId(scenario) ? scenario : scenarios.config.scenario,
      ...(latencyMs !== undefined ? { latencyMs } : {}),
      ...(paymentDelayMs !== undefined ? { paymentDelayMs } : {}),
      ...(accessTokenTtlMs !== undefined ? { accessTokenTtlMs } : {}),
      ...(seed !== undefined ? { seed } : {}),
    })
  }
  return params.get('mockReset') === '1'
}

export const parseScenarioId = (value: unknown): ScenarioId | null =>
  typeof value === 'string' && isScenarioId(value) ? value : null
