import { AccountMenu, LoginPage, RegisterPage } from '../support/pages/account-pages.ts'
import { NftDetailPage } from '../support/pages/nft-detail-page.ts'
import { loginAs, readBrowserStorage, SESSION_STORAGE_KEY } from '../support/session.ts'
import { testData } from '../support/test-data.ts'
import { expect, FIXED_NOW, test } from '../support/test.ts'

/**
 * T03 — cadastro, login, expiração de sessão, logout e troca de usuário
 * (R07, R08, R32–R37, R43, R62).
 */

const { alex, bia } = testData.users
const newUser = { name: 'Rafa Teste', email: 'rafa@jungle.test', password: 'Rafa@12345' }

test.describe('cadastro', () => {
  test('cria a conta, autentica e volta ao fluxo anterior', async ({ page, mock }) => {
    await mock.open(`${RegisterPage.path}?redirect=${encodeURIComponent('/favoritos')}`)

    await new RegisterPage(page).registerWith(newUser)

    await expect(page).toHaveURL('/favoritos')
    await expect(new AccountMenu(page).userMenu).toBeVisible()
  })

  test('campos obrigatórios mostram erro associado ao campo', async ({ page, mock }) => {
    const register = new RegisterPage(page)
    await mock.open(RegisterPage.path)

    await register.submit.click()

    for (const field of [register.name, register.email, register.password]) {
      await expect(field).toHaveAttribute('aria-invalid', 'true')
      await expect(field).toHaveAccessibleDescription(/.+/)
    }
    await expect(register.name).toBeFocused()
  })

  test('e-mail já cadastrado (409) aparece no campo de e-mail', async ({ page, mock }) => {
    const register = new RegisterPage(page)
    await mock.open(RegisterPage.path, { scenario: 'register-conflict' })

    await register.registerWith(newUser)

    await expect(register.email).toHaveAttribute('aria-invalid', 'true')
    await expect(register.email).toHaveAccessibleDescription(/já (está )?(cadastrado|em uso)/i)
    await expect(page).toHaveURL(RegisterPage.path)
  })

  test('erro de validação da API (422) aparece no campo correspondente', async ({ page, mock }) => {
    const register = new RegisterPage(page)
    await mock.open(RegisterPage.path, { scenario: 'validation-error' })

    await register.registerWith(newUser)

    await expect(page.locator('[aria-invalid="true"]').first()).toBeVisible()
    await expect(page).toHaveURL(RegisterPage.path)
  })
})

test.describe('login', () => {
  test('credenciais inválidas não revelam qual campo errou', async ({ page, mock }) => {
    const login = new LoginPage(page)
    await mock.open(LoginPage.path)

    await login.loginWith({ email: alex.email, password: 'senha-errada' })

    await expect(login.formError).toHaveText(/e-mail ou senha/i)
    await expect(login.email).not.toHaveAttribute('aria-invalid', 'true')
    await expect(login.password).toHaveValue('')
  })

  test('rota privada redireciona ao login e volta após entrar', async ({ page, mock }) => {
    const login = new LoginPage(page)
    await mock.open('/favoritos')

    await login.expectRedirectTo('/favoritos')
    await login.loginWith(alex)

    await expect(page).toHaveURL('/favoritos')
  })

  for (const privatePath of ['/favoritos', '/perfil', '/perfil/carteiras', '/checkout']) {
    test(`acesso direto a ${privatePath} exige login`, async ({ page, mock }) => {
      await mock.open(privatePath)

      await new LoginPage(page).expectRedirectTo(privatePath)
    })
  }

  test('senha não fica guardada em claro no navegador', async ({ page, mock }) => {
    await loginAs(page, mock, alex)

    const stored = await readBrowserStorage(page)

    expect(stored).toContain(SESSION_STORAGE_KEY)
    expect(stored).not.toContain(alex.password)
  })
})

test.describe('sessão', () => {
  test('sessão sobrevive a refresh', async ({ page, mock }) => {
    await loginAs(page, mock, alex, '/favoritos')

    await page.reload()

    await expect(page).toHaveURL('/favoritos')
    await expect(new AccountMenu(page).userMenu).toBeVisible()
  })

  test.describe('com relógio controlado', () => {
    test.use({ clockAt: FIXED_NOW })

    test('token de acesso vencido é renovado sem perder a sessão', async ({ page, mock }) => {
      await loginAs(page, mock, alex, '/', { accessTokenTtlMs: 60_000 })

      await page.clock.fastForward(61_000)
      await page.goto('/favoritos')

      await expect(page).toHaveURL('/favoritos')
      await expect(new AccountMenu(page).userMenu).toBeVisible()
    })
  })

  test('sessão expirada na navegação leva ao login com aviso e retorna', async ({ page, mock }) => {
    const login = new LoginPage(page)
    await loginAs(page, mock, alex, '/favoritos')

    await mock.expireSessions()
    await page.goto('/perfil')

    await login.expectRedirectTo('/perfil')
    await expect(login.expiredNotice).toBeVisible()
    await login.loginWith(alex)
    await expect(page).toHaveURL('/perfil')
  })

  test('logout limpa a sessão e bloqueia rotas privadas', async ({ page, mock }) => {
    const menu = new AccountMenu(page)
    // Sai a partir do Início: numa rota privada a guarda já leva ao login (tela cheia no mobile).
    await loginAs(page, mock, alex, '/')

    await menu.logout()

    await expect(menu.signIn).toBeVisible()
    expect(await readBrowserStorage(page)).not.toContain(SESSION_STORAGE_KEY)
    await page.goto('/favoritos')
    await new LoginPage(page).expectRedirectTo('/favoritos')
  })

  test('troca de usuário não mostra dados do anterior', async ({ page, mock }) => {
    const detail = new NftDetailPage(page)
    const nftId = testData.nfts.available.id
    await loginAs(page, mock, alex, NftDetailPage.path(nftId))
    const nft = await detail.loadAfter(nftId, () => page.reload())
    // O favorito do Alex precisa estar salvo no servidor antes da troca.
    await Promise.all([
      page.waitForResponse((response) => response.request().method() === 'PUT' && response.ok()),
      detail.favorite.click(),
    ])
    await expect(detail.favorite).toHaveAttribute('aria-pressed', 'true')

    // No mobile o menu da conta fica na tab bar, que não aparece no detalhe.
    await page.goto('/')
    await new AccountMenu(page).logout()
    await page.goto(`${LoginPage.path}?redirect=%2Ffavoritos`)
    const favoritesResponse = page.waitForResponse(
      (response) => new URL(response.url()).pathname.endsWith('/api/favorites') && response.ok(),
    )
    await new LoginPage(page).loginWith(bia)

    const body = (await (await favoritesResponse).json()) as { items: unknown[] }
    expect(body.items).toHaveLength(0)
    await expect(page.getByRole('link', { name: nft.name })).toBeHidden()

    await page.goto(NftDetailPage.path(nftId))
    await expect(detail.favorite).toHaveAttribute('aria-pressed', 'false')
  })
})
