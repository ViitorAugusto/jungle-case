import type { Page } from '@playwright/test'

import { api, apiAfter, recordCalls } from '../support/api.ts'
import { addToCartFromDetail, collectorOf } from '../support/flows.ts'
import type { MockControl, MockOptions } from '../support/mock-control.ts'
import { LoginPage } from '../support/pages/account-pages.ts'
import { CheckoutPage } from '../support/pages/checkout-pages.ts'
import { ProfileMenu, ProfilePage, WalletsPage, type WalletInput } from '../support/pages/profile-pages.ts'
import { loginAs } from '../support/session.ts'
import { testData } from '../support/test-data.ts'
import { expect, test } from '../support/test.ts'

/**
 * T08 — perfil, avatar, senha e carteiras com erros de validação (R09, R10,
 * R25, R36, R37), com os nomes do Figma (premissa 24). Alterações têm de
 * persistir após refresh; as carteiras alimentam o pagamento (premissa 23).
 */

const { alex, bia } = testData.users
const { alexPrimaryAddress, alexPrimaryNickname } = testData.wallets

/** PNG 1×1 transparente. */
const PNG_1PX = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
  'base64',
)
const avatarFile = (name: string, mimeType: string, buffer: Buffer) => ({ name, mimeType, buffer })
const SOLANA_ADDRESS = '7EcDhSYGxXyscszYEp35KHN8vvw3svAuLKTzXwCFLtV'
const EVM_ADDRESS = '0x2222222222222222222222222222222222222222'

/** Carteira completa da Bia, que começa sem carteira, ENS e apelido. */
const biaWallet = (overrides: Partial<WalletInput> = {}): WalletInput => ({
  nickname: 'Carteira da Bia',
  address: EVM_ADDRESS,
  network: 'Ethereum',
  provider: 'MetaMask',
  displayName: bia.name,
  profileName: bia.name,
  email: bia.email,
  ensLabel: 'bialima',
  referralCode: 'JNG-2026',
  ...overrides,
})

const openCheckoutWithItem = async (page: Page) => {
  await addToCartFromDetail(page, testData.nfts.available.id, testData.nfts.available.editionId)
  await page.goto(CheckoutPage.path)
  return new CheckoutPage(page)
}

test.describe('menu do perfil', () => {
  test('links funcionam e itens fora do escopo aparecem como "Em breve"', async ({ page, mock }) => {
    const menu = new ProfileMenu(page)
    await loginAs(page, mock, alex, ProfilePage.path)

    await expect(menu.profileData).toHaveAttribute('aria-current', 'page')
    for (const item of ['Atividade', 'Ofertas', 'Arquivos baixados', 'Suporte'] as const) {
      await expect(menu.comingSoon(item)).toContainText('Em breve')
    }
    await menu.wallets.click()
    await expect(page).toHaveURL(WalletsPage.path)
    await expect(menu.wallets).toHaveAttribute('aria-current', 'page')
    await menu.wishlist.click()
    await expect(page).toHaveURL('/favoritos')
  })
})

test.describe('perfil', () => {
  test('edita os dados e eles persistem após refresh', async ({ page, mock }) => {
    const profile = new ProfilePage(page)
    await loginAs(page, mock, alex, ProfilePage.path)
    await expect(profile.heading).toBeVisible()

    await profile.displayName.fill('Alex Rocha Lima')
    await profile.username.fill('alex_lima')
    await profile.ensName.fill('alexlima')
    await profile.walletNickname.fill('Cofre principal')
    await profile.save.click()
    await expect(profile.feedback).toBeVisible()

    await page.reload()
    await expect(profile.displayName).toHaveValue('Alex Rocha Lima')
    await expect(profile.username).toHaveValue('alex_lima')
    await expect(profile.ensName).toHaveValue('alexlima')
    await expect(profile.walletNickname).toHaveValue('Cofre principal')
  })

  test('validação local marca o campo e não envia', async ({ page, mock }) => {
    const profile = new ProfilePage(page)
    await loginAs(page, mock, alex, ProfilePage.path)
    const updates = recordCalls(page, { method: 'PATCH', path: /\/api\/profile$/ })

    await profile.displayName.fill('')
    await profile.username.fill('Alex Rocha')
    await profile.email.fill('sem-arroba')
    await profile.save.click()

    for (const field of [profile.displayName, profile.username, profile.email]) {
      await expect(field).toHaveAttribute('aria-invalid', 'true')
      await expect(field).toHaveAccessibleDescription(/.+/)
    }
    await expect(profile.displayName).toBeFocused()
    expect(updates).toHaveLength(0)
  })

  test('e-mail de outro usuário vem da API como erro no campo', async ({ page, mock }) => {
    const profile = new ProfilePage(page)
    await loginAs(page, mock, alex, ProfilePage.path)

    await profile.email.fill(bia.email)
    await profile.save.click()

    await expect(profile.email).toHaveAttribute('aria-invalid', 'true')
    await expect(profile.email).toHaveAccessibleDescription(/em uso/i)
  })

  test('nome de usuário de outro usuário vem da API como erro no campo', async ({ page, mock }) => {
    const profile = new ProfilePage(page)
    await loginAs(page, mock, alex, ProfilePage.path)

    await profile.username.fill('bia_lima')
    await profile.save.click()

    await expect(profile.username).toHaveAttribute('aria-invalid', 'true')
    await expect(profile.username).toHaveAccessibleDescription(/em uso/i)
  })

  test('erro de validação da API (422) aparece no campo', async ({ page, mock }) => {
    const profile = new ProfilePage(page)
    await loginAs(page, mock, alex, ProfilePage.path, { scenario: 'validation-error' })

    await profile.displayName.fill('Nome válido no cliente')
    await profile.save.click()

    await expect(page.locator('[aria-invalid="true"]').first()).toBeVisible()
  })
})

test.describe('avatar', () => {
  test('troca o avatar com prévia, persiste após refresh e pode ser removido', async ({ page, mock }) => {
    const profile = new ProfilePage(page)
    await loginAs(page, mock, alex, ProfilePage.path)

    await profile.avatarInput.setInputFiles(avatarFile('avatar.png', 'image/png', PNG_1PX))
    await expect(profile.avatar).toHaveAttribute('src', /^data:image\/png/)
    await profile.save.click()
    await expect(profile.feedback).toBeVisible()

    await page.reload()
    await expect(profile.avatar).toHaveAttribute('src', /^data:image\/png/)

    await profile.removeAvatar.click()
    await profile.save.click()
    await page.reload()
    await expect(profile.avatar).not.toHaveAttribute('src', /^data:image/)
  })

  test('arquivo que não é imagem é recusado antes do envio', async ({ page, mock }) => {
    const profile = new ProfilePage(page)
    await loginAs(page, mock, alex, ProfilePage.path)

    await profile.avatarInput.setInputFiles(avatarFile('notas.txt', 'text/plain', Buffer.from('texto')))

    await expect(profile.avatarError).toBeVisible()
  })

  test('imagem acima de 512 KB é recusada', async ({ page, mock }) => {
    const profile = new ProfilePage(page)
    await loginAs(page, mock, alex, ProfilePage.path)

    await profile.avatarInput.setInputFiles(avatarFile('grande.png', 'image/png', Buffer.alloc(600 * 1024)))

    await expect(profile.avatarError).toBeVisible()
  })
})

test.describe('senha', () => {
  test('senha atual errada vem da API como erro no campo', async ({ page, mock }) => {
    const profile = new ProfilePage(page)
    await loginAs(page, mock, alex, ProfilePage.path)

    await profile.changePassword('errada', 'Nova@12345')

    await expect(profile.currentPassword).toHaveAttribute('aria-invalid', 'true')
    await expect(profile.currentPassword).toHaveAccessibleDescription(/incorreta/i)
  })

  test('confirmação diferente é barrada no cliente', async ({ page, mock }) => {
    const profile = new ProfilePage(page)
    await loginAs(page, mock, alex, ProfilePage.path)

    await profile.changePassword(alex.password, 'Nova@12345', 'Outra@12345')

    await expect(profile.confirmPassword).toHaveAttribute('aria-invalid', 'true')
  })

  test('senha alterada vale no próximo login e campos são limpos', async ({ page, mock }) => {
    const profile = new ProfilePage(page)
    await loginAs(page, mock, alex, ProfilePage.path)

    await profile.changePassword(alex.password, 'Nova@12345')

    await expect(profile.feedback).toContainText('Senha alterada.')
    await expect(profile.currentPassword).toHaveValue('')
    await expect(profile.newPassword).toHaveValue('')
    await expect(profile.confirmPassword).toHaveValue('')

    await new ProfileMenu(page).logout()
    await page.goto(LoginPage.path)
    await new LoginPage(page).loginWith({ email: alex.email, password: 'Nova@12345' })
    await expect(page).not.toHaveURL(LoginPage.path)
  })
})

test.describe('carteiras', () => {
  test('adiciona a secundária igual à principal; persiste e aparece no pagamento', async ({ page, mock }) => {
    const wallets = new WalletsPage(page)
    await loginAs(page, mock, alex, WalletsPage.path)
    await expect(wallets.secondaryEmpty).toBeVisible()
    await wallets.addSecondary.click()
    const secondary = wallets.slot('Carteira secundária')

    await secondary.sameAsPrimary.check()
    await expect(secondary.displayName).toHaveValue(alex.name)
    await expect(secondary.email).not.toBeEditable()
    await secondary.fill({ nickname: 'Reserva', address: SOLANA_ADDRESS, network: 'Solana' })
    await secondary.save.click()
    await expect(wallets.saved).toBeVisible()

    await page.reload()
    await expect(secondary.nickname).toHaveValue('Reserva')
    await expect(secondary.address).toHaveValue(SOLANA_ADDRESS)
    await expect(secondary.networkSelect).toContainText('Solana')

    // No pagamento, escolher a secundária preenche rede e endereço (premissa 23).
    const checkout = await openCheckoutWithItem(page)
    await checkout.savedWallet('Reserva').click()
    await expect(checkout.networkSelect).toContainText('Solana')
    await expect(checkout.walletAddress).toHaveValue(SOLANA_ADDRESS)
  })

  test('remove a secundária e volta ao estado vazio', async ({ page, mock }) => {
    const wallets = new WalletsPage(page)
    await loginAs(page, mock, alex, WalletsPage.path)
    await wallets.addSecondary.click()
    const secondary = wallets.slot('Carteira secundária')
    await secondary.sameAsPrimary.check()
    await secondary.fill({ nickname: 'Reserva', address: SOLANA_ADDRESS, network: 'Solana' })
    await secondary.save.click()
    await expect(wallets.saved).toBeVisible()

    await secondary.remove.click()

    await expect(wallets.secondaryEmpty).toBeVisible()
    await page.reload()
    await expect(wallets.secondaryEmpty).toBeVisible()
  })

  test('edita a principal e o pagamento abre com ela, somente leitura', async ({ page, mock }) => {
    const wallets = new WalletsPage(page)
    await loginAs(page, mock, alex, WalletsPage.path)
    const primary = wallets.slot('Carteira principal')
    await expect(primary.nickname).toHaveValue(alexPrimaryNickname)
    await expect(primary.address).toHaveValue(alexPrimaryAddress)

    await primary.fill({ nickname: 'Cofre Polygon', address: EVM_ADDRESS, network: 'Polygon' })
    await primary.save.click()
    await expect(wallets.saved).toBeVisible()

    await page.reload()
    await expect(primary.address).toHaveValue(EVM_ADDRESS)
    await expect(primary.networkSelect).toContainText('Polygon')

    const checkout = await openCheckoutWithItem(page)
    await expect(checkout.savedWallet('Cofre Polygon')).toBeChecked()
    await expect(checkout.networkSelect).toContainText('Polygon')
    await expect(checkout.networkSelect).toBeDisabled()
    await expect(checkout.walletAddress).toHaveValue(EVM_ADDRESS)
    await expect(checkout.walletAddress).not.toBeEditable()
  })

  test('endereço inválido para a rede marca o campo', async ({ page, mock }) => {
    const wallets = new WalletsPage(page)
    await loginAs(page, mock, bia, WalletsPage.path)
    await wallets.addPrimary.click()
    const primary = wallets.slot('Carteira principal')

    await primary.fill(biaWallet({ address: '0x123' }))
    await primary.save.click()

    await expect(primary.address).toHaveAttribute('aria-invalid', 'true')
    await expect(primary.address).toHaveAccessibleDescription(/endereço inválido/i)
  })

  test('mesmo endereço nas duas carteiras é recusado no campo Endereço', async ({ page, mock }) => {
    const wallets = new WalletsPage(page)
    await loginAs(page, mock, alex, WalletsPage.path)
    await wallets.addSecondary.click()
    const secondary = wallets.slot('Carteira secundária')

    await secondary.sameAsPrimary.check()
    await secondary.fill({ nickname: 'Cópia', address: alexPrimaryAddress, network: 'Ethereum' })
    await secondary.save.click()

    await expect(secondary.address).toHaveAttribute('aria-invalid', 'true')
    await expect(secondary.address).toHaveAccessibleDescription(/.+/)
  })

  test('erro de validação da API (422) aparece na carteira', async ({ page, mock }) => {
    const wallets = new WalletsPage(page)
    await loginAs(page, mock, bia, WalletsPage.path, { scenario: 'validation-error' })
    await wallets.addPrimary.click()
    const primary = wallets.slot('Carteira principal')

    await primary.fill(biaWallet())
    await primary.save.click()

    await expect(primary.root.locator('[aria-invalid="true"]').first()).toBeVisible()
  })

  test('conexão recusada pela carteira mostra erro, não conecta e permite tentar de novo', async ({
    page,
    mock,
  }) => {
    await loginAs(page, mock, alex, '/', { scenario: 'wallet-rejected' })
    const checkout = await openCheckoutWithItem(page)

    await checkout.walletType('MetaMask').click()
    await expect(checkout.walletRejected).toBeVisible()
    await expect(checkout.disconnectWallet).toBeHidden()
    await expect(checkout.review).toBeDisabled()

    await mock.setScenario({ scenario: 'success' })
    await checkout.connectWallet.click()
    await expect(checkout.walletConnected).toBeVisible()
    await checkout.disconnectWallet.click()
    await expect(checkout.connectWallet).toBeVisible()
  })
})

test.describe('pagamento: perfil do colecionador', () => {
  const openCheckout = async (page: Page, mock: MockControl, options?: MockOptions) => {
    await loginAs(page, mock, alex, '/', options)
    return openCheckoutWithItem(page)
  }

  test('campos do Figma vêm do perfil e da carteira principal', async ({ page, mock }) => {
    const checkout = await openCheckout(page, mock)

    await expect(checkout.displayName).toHaveValue(alex.name)
    await expect(checkout.username).toHaveValue('alex_rocha')
    await expect(checkout.email).toHaveValue(alex.email)
    await expect(checkout.ensName).toHaveValue(/^alexrocha/)
    await expect(checkout.referralCode).toHaveValue('JNG-2026')
    await expect(checkout.savedWallet(alexPrimaryNickname)).toBeChecked()
    await expect(checkout.walletAddress).toHaveValue(alexPrimaryAddress)
    await expect(checkout.walletType('MetaMask')).toBeChecked()
  })

  test('campos do Figma inválidos são marcados no cliente e nada é enviado', async ({ page, mock }) => {
    const quotes = recordCalls(page, api.createQuote)
    const checkout = await openCheckout(page, mock)
    await checkout.useWallet('Ethereum', '0x123')
    await checkout.username.fill('Alex Rocha')
    await checkout.profileName.fill('A')
    await checkout.ensName.fill('a')
    await checkout.referralCode.fill('123')
    await checkout.secondaryWallet.fill('nao-e-carteira')
    await checkout.note.fill('x'.repeat(281))
    await checkout.review.click()

    for (const field of [
      checkout.username,
      checkout.profileName,
      checkout.ensName,
      checkout.referralCode,
      checkout.walletAddress,
      checkout.secondaryWallet,
    ]) {
      await expect(field).toHaveAttribute('aria-invalid', 'true')
    }
    await expect(checkout.referralCode).toHaveAccessibleDescription(/JNG-2026/)
    // A observação é limitada a 280 caracteres no próprio campo.
    await expect(checkout.note).toHaveValue('x'.repeat(280))
    await expect(checkout.username).toBeFocused()
    expect(quotes).toHaveLength(0)
  })

  test('e-mail e nome de exibição apagados são obrigatórios', async ({ page, mock }) => {
    const checkout = await openCheckout(page, mock)
    await checkout.fillPayment(collectorOf(alex))
    await checkout.displayName.fill('')
    await checkout.email.fill('alex@')
    await checkout.review.click()

    await expect(checkout.displayName).toHaveAttribute('aria-invalid', 'true')
    await expect(checkout.email).toHaveAttribute('aria-invalid', 'true')
  })

  test('pedido recusado pela API (422) avisa e não fica pendente', async ({ page, mock }) => {
    const checkout = await openCheckout(page, mock)
    await checkout.fillPayment(collectorOf(alex))
    await apiAfter(page, 'quote', api.createQuote, () => checkout.review.click())
    await mock.failNext({ method: 'POST', path: '/orders', status: 422, count: 1 })

    await apiAfter(page, 'error', api.createOrder, () => checkout.confirm.click())

    await expect(page.getByRole('alert').first()).toBeVisible()
    await expect(checkout.pending).toBeHidden()
    await expect(page).toHaveURL(CheckoutPage.path)
  })
})
