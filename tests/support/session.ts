import type { Page } from '@playwright/test'

import type { MockControl, MockOptions } from './mock-control.ts'
import { LoginPage, waitForStoredSession, type Credentials } from './pages/account-pages.ts'

export { SESSION_STORAGE_KEY } from './pages/account-pages.ts'

/**
 * Entra pela tela de login e espera voltar a `returnTo`. Passa pelo fluxo real
 * (formulário → API simulada → sessão), sem injetar token.
 */
export const loginAs = async (
  page: Page,
  mock: MockControl,
  user: Credentials,
  returnTo = '/',
  options: MockOptions = {},
): Promise<void> => {
  await mock.open(`${LoginPage.path}?redirect=${encodeURIComponent(returnTo)}`, options)
  await new LoginPage(page).loginWith(user)
  await page.waitForURL((url) => url.pathname === returnTo)
  await waitForStoredSession(page, true)
}

/** Conteúdo bruto do `localStorage` e `sessionStorage`, para checar o que o cliente guarda. */
export const readBrowserStorage = (page: Page): Promise<string> =>
  page.evaluate(() => {
    const dump = (storage: Storage) =>
      Array.from({ length: storage.length }, (_, index) => {
        const key = storage.key(index) ?? ''
        return `${key}=${storage.getItem(key) ?? ''}`
      })
    return [...dump(window.localStorage), ...dump(window.sessionStorage)].join('\n')
  })
