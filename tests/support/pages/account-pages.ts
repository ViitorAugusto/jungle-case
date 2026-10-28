import type { Locator, Page } from '@playwright/test'

export type Credentials = { email: string; password: string }

/** Chave da sessão no armazenamento do navegador (`src/adapters/storage/browser-storage.ts`). */
export const SESSION_STORAGE_KEY = 'nft-market:session'

/**
 * Espera a sessão ser gravada (`true`) ou removida (`false`) do navegador.
 * Vale para qualquer layout, sem depender de onde fica o menu da conta.
 */
export const waitForStoredSession = (page: Page, present: boolean): Promise<unknown> =>
  page.waitForFunction(({ key, expected }) => (window.localStorage.getItem(key) !== null) === expected, {
    key: SESSION_STORAGE_KEY,
    expected: present,
  })

/** Tela de login (`/login?redirect=<rota>`). */
export class LoginPage {
  static readonly path = '/login'

  private readonly page: Page

  readonly email: Locator
  readonly password: Locator
  readonly submit: Locator
  readonly registerLink: Locator
  readonly formError: Locator
  readonly expiredNotice: Locator

  constructor(page: Page) {
    this.page = page
    this.email = page.getByRole('textbox', { name: 'E-mail' })
    this.password = page.getByLabel('Senha', { exact: true })
    this.submit = page.getByRole('button', { name: 'Entrar', exact: true })
    // Aba "Criar conta" no modal desktop; "Crie uma conta" na tela mobile.
    this.registerLink = page.getByRole('link', { name: /^(Criar conta|Crie uma conta)$/ })
    this.formError = page.getByRole('alert')
    this.expiredNotice = page.getByRole('status').filter({ hasText: 'Sua sessão expirou' })
  }

  async loginWith({ email, password }: Credentials): Promise<void> {
    await this.email.fill(email)
    await this.password.fill(password)
    await this.submit.click()
  }

  async expectRedirectTo(returnTo: string): Promise<void> {
    await this.page.waitForURL(
      (url) => url.pathname === LoginPage.path && url.searchParams.get('redirect') === returnTo,
    )
  }
}

/** Tela de cadastro (`/cadastro`). */
export class RegisterPage {
  static readonly path = '/cadastro'

  readonly name: Locator
  readonly email: Locator
  readonly password: Locator
  readonly confirmPassword: Locator
  readonly submit: Locator

  constructor(page: Page) {
    this.name = page.getByRole('textbox', { name: 'Nome' })
    this.email = page.getByRole('textbox', { name: 'E-mail' })
    this.password = page.getByLabel('Senha', { exact: true })
    this.confirmPassword = page.getByLabel('Confirmar senha')
    // "Criar conta" no modal desktop; "Criar perfil" na tela mobile (Figma).
    this.submit = page.getByRole('button', { name: /^Criar (conta|perfil)$/ })
  }

  async registerWith(data: { name: string; email: string; password: string }): Promise<void> {
    await this.name.fill(data.name)
    await this.email.fill(data.email)
    await this.password.fill(data.password)
    await this.confirmPassword.fill(data.password)
    await this.submit.click()
  }
}

/** Menu da conta no cabeçalho: "Entrar" para visitante, menu do usuário quando logado. */
export class AccountMenu {
  private readonly page: Page

  readonly signIn: Locator
  readonly userMenu: Locator

  constructor(page: Page) {
    this.page = page
    this.signIn = page.getByRole('link', { name: 'Entrar' })
    this.userMenu = page.getByRole('button', { name: 'Menu da conta' })
  }

  /**
   * Sai pelo menu da conta e espera a API e a limpeza da sessão local terminarem.
   * Telas mobile sem tab bar (detalhe, carrinho, pagamento) não têm o menu: sai pelo Início.
   */
  async logout(): Promise<void> {
    if ((await this.userMenu.filter({ visible: true }).count()) === 0) await this.page.goto('/')
    await this.userMenu.filter({ visible: true }).click()
    await Promise.all([
      this.page.waitForResponse((response) => new URL(response.url()).pathname.endsWith('/api/auth/logout')),
      this.page.getByRole('menuitem', { name: 'Sair' }).click(),
    ])
    await waitForStoredSession(this.page, false)
  }
}
