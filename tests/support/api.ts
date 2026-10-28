import type { Page, Response } from '@playwright/test'

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

/** Resumo de valores como a API simulada devolve (strings decimais em ETH). */
export type PriceSummaryBody = {
  subtotalEth: string
  discountEth: string
  networkFeeEth: string
  totalEth: string
}

export type CartBody = {
  lines: {
    id: string
    nftId: string
    editionId: string
    nftName: string
    quantity: number
    available: number
  }[]
  coupon: { code: string } | null
  summary: PriceSummaryBody
  itemCount: number
}

/** Perfil do colecionador e carteira de pagamento do pedido (premissa 23). */
export type CollectorBody = {
  displayName: string
  username: string
  profileName: string
  email: string
  ensName: string
  referralCode: string
  note: string | null
}

export type PaymentBody = {
  network: 'ethereum' | 'polygon' | 'solana'
  address: string
  secondaryAddressOrEns: string | null
  provider: 'metamask' | 'walletconnect' | 'coinbase'
  walletId: string | null
}

export type OrderBody = {
  id: string
  status: 'pending' | 'confirmed' | 'rejected'
  lines: { nftId: string; editionId: string; nftName: string; quantity: number }[]
  summary: PriceSummaryBody
  collector: CollectorBody
  payment: PaymentBody
  transaction: { hash: string; explorerUrl: string } | null
}

export type ReceiptBody = {
  orderId: string
  transaction: { hash: string; explorerUrl: string }
  lines: { nftName: string; quantity: number }[]
  summary: PriceSummaryBody
  collector: CollectorBody
  payment: PaymentBody
}

export type QuoteBody = {
  id: string
  summary: PriceSummaryBody
  expiresAt: string
}

/** Corpo esperado por recurso; `error` cobre respostas 4xx/5xx. */
type Bodies = {
  cart: CartBody
  quote: QuoteBody
  order: OrderBody
  receipt: ReceiptBody
  error: { message: string; reason?: string }
}

export type RecordedCall = {
  headers: Record<string, string>
  status: number | null
  body: unknown
}

/**
 * Grava todas as chamadas a uma rota a partir de agora (requisição e, quando
 * chegar, a resposta). Útil para provar que não houve envio duplicado.
 */
export const recordCalls = (page: Page, request: { method: Method; path: RegExp }): RecordedCall[] => {
  const calls: RecordedCall[] = []
  page.on('request', (candidate) => {
    if (candidate.method() !== request.method || !request.path.test(new URL(candidate.url()).pathname)) return
    const call: RecordedCall = { headers: candidate.headers(), status: null, body: null }
    calls.push(call)
    void candidate
      .response()
      .then(async (response) => {
        if (!response) return
        call.status = response.status()
        call.body = await response.json().catch(() => null)
      })
      // Requisição ainda aberta quando a página recarrega ou o teste termina.
      .catch(() => undefined)
  })
  return calls
}

const matches = (method: Method, path: RegExp) => (response: Response) =>
  response.request().method() === method && path.test(new URL(response.url()).pathname)

/**
 * Executa `action` e devolve status e corpo JSON da resposta da API simulada
 * que casar com método e caminho. `kind` diz o corpo esperado: um recurso
 * exige resposta de sucesso; `error` exige falha.
 */
export const apiAfter = async <K extends keyof Bodies>(
  page: Page,
  kind: K,
  request: { method: Method; path: RegExp },
  action: () => Promise<unknown>,
): Promise<{ status: number; body: Bodies[K] }> => {
  const [response] = await Promise.all([
    page.waitForResponse(matches(request.method, request.path)),
    action(),
  ])
  if (response.ok() !== (kind !== 'error')) {
    throw new Error(`${request.method} ${response.url()} respondeu ${response.status()}, esperado ${kind}`)
  }
  return { status: response.status(), body: (await response.json()) as Bodies[K] }
}

/** Rotas da API usadas pelos testes. */
export const api = {
  addCartItem: { method: 'POST', path: /\/api\/cart\/items$/ },
  updateCartItem: { method: 'PATCH', path: /\/api\/cart\/items\/[^/]+$/ },
  removeCartItem: { method: 'DELETE', path: /\/api\/cart\/items\/[^/]+$/ },
  applyCoupon: { method: 'PUT', path: /\/api\/cart\/coupon$/ },
  removeCoupon: { method: 'DELETE', path: /\/api\/cart\/coupon$/ },
  mergeCart: { method: 'POST', path: /\/api\/cart\/merge$/ },
  createQuote: { method: 'POST', path: /\/api\/quotes$/ },
  createOrder: { method: 'POST', path: /\/api\/orders$/ },
  getOrder: { method: 'GET', path: /\/api\/orders\/[^/]+$/ },
  getCart: { method: 'GET', path: /\/api\/cart$/ },
  receipt: { method: 'GET', path: /\/api\/orders\/[^/]+\/receipt$/ },
} as const satisfies Record<string, { method: Method; path: RegExp }>
