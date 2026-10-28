import { test as base } from '@playwright/test'

import { MockControl } from './mock-control.ts'

/** Instante fixo usado quando o teste pede relógio controlado. */
export const FIXED_NOW = new Date('2026-03-10T12:00:00.000-03:00')

type Options = {
  /**
   * Quando definido, instala o relógio do Playwright nesse instante antes da
   * navegação. O tempo continua andando; use `page.clock.pauseAt`/`runFor`
   * para controlar expiração de sessão e prazos de pagamento.
   */
  clockAt: Date | undefined
}

type Fixtures = {
  mock: MockControl
}

/**
 * `test` do projeto. Cada teste roda em contexto novo do navegador, então o
 * armazenamento local (banco simulado, sessão, carrinho) começa vazio; a
 * fixture `mock` ainda reseta o banco na abertura para garantir o cenário
 * conhecido.
 */
export const test = base.extend<Options & Fixtures>({
  clockAt: [undefined, { option: true }],

  mock: async ({ page, clockAt }, provide) => {
    if (clockAt) await page.clock.install({ time: clockAt })
    await provide(new MockControl(page))
  },
})

export { expect } from '@playwright/test'
