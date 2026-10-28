import type { Locator, Page } from '@playwright/test'

import { waitForStoredSession } from './account-pages.ts'
import type { NetworkName, WalletProviderName } from './checkout-pages.ts'

/** Menu lateral "Meu perfil", comum a `/perfil` e `/perfil/carteiras` (premissa 24). */
export class ProfileMenu {
  readonly root: Locator
  readonly profileData: Locator
  readonly wallets: Locator
  readonly wishlist: Locator
  readonly signOut: Locator

  constructor(page: Page) {
    this.root = page.getByRole('navigation', { name: 'Meu perfil' })
    this.profileData = this.root.getByRole('link', { name: 'Dados do perfil' })
    this.wallets = this.root.getByRole('link', { name: 'Carteiras' })
    this.wishlist = this.root.getByRole('link', { name: 'Lista de interesse' })
    this.signOut = this.root.getByRole('button', { name: 'Sair' })
  }

  /** Sai pelo menu e espera a API e a limpeza da sessão local terminarem. */
  async logout(): Promise<void> {
    await Promise.all([
      this.root
        .page()
        .waitForResponse((response) => new URL(response.url()).pathname.endsWith('/api/auth/logout')),
      this.signOut.click(),
    ])
    await waitForStoredSession(this.root.page(), false)
  }

  /** Itens fora do escopo: visíveis, com `aria-disabled` e "Em breve" (R12). */
  comingSoon(name: 'Atividade' | 'Ofertas' | 'Arquivos baixados' | 'Suporte'): Locator {
    return this.root.locator('[aria-disabled="true"]').filter({ hasText: name })
  }
}

/** Perfil (`/perfil`): dados do colecionador, avatar e senha, com um único "Salvar". */
export class ProfilePage {
  static readonly path = '/perfil'

  readonly heading: Locator
  readonly displayName: Locator
  readonly username: Locator
  readonly email: Locator
  /** Só o rótulo: o sufixo `.eth` é fixo na interface. */
  readonly ensName: Locator
  readonly walletNickname: Locator
  readonly avatar: Locator
  readonly avatarInput: Locator
  readonly removeAvatar: Locator
  readonly avatarError: Locator
  readonly passwordRegion: Locator
  readonly currentPassword: Locator
  readonly newPassword: Locator
  readonly confirmPassword: Locator
  readonly save: Locator
  readonly feedback: Locator

  constructor(page: Page) {
    this.heading = page.getByRole('heading', { name: 'Perfil do colecionador' })
    this.displayName = page.getByRole('textbox', { name: 'Nome de exibição' })
    this.username = page.getByRole('textbox', { name: 'Nome de usuário' })
    this.email = page.getByRole('textbox', { name: 'E-mail' })
    this.ensName = page.getByRole('textbox', { name: 'Nome ENS' })
    this.walletNickname = page.getByRole('textbox', { name: 'Apelido da carteira' })
    this.avatar = page.getByRole('img', { name: 'Avatar' })
    this.avatarInput = page.getByLabel('Alterar avatar')
    this.removeAvatar = page.getByRole('button', { name: 'Remover avatar' })
    this.avatarError = page.getByRole('alert').filter({ hasText: /PNG|JPEG|WebP|512 KB/ })
    this.passwordRegion = page.getByRole('region', { name: 'Alterar senha' })
    this.currentPassword = this.passwordRegion.getByLabel('Senha atual')
    this.newPassword = this.passwordRegion.getByLabel('Nova senha', { exact: true })
    this.confirmPassword = this.passwordRegion.getByLabel('Confirmar nova senha')
    this.save = page.getByRole('button', { name: 'Salvar', exact: true })
    // O indicador de tempo real também é `status`: filtra pelo texto do perfil.
    this.feedback = page.getByRole('status').filter({ hasText: 'Alterações salvas.' })
  }

  /** Senha vai junto com o "Salvar" do perfil (campos opcionais). */
  async changePassword(current: string, next: string, confirmation = next): Promise<void> {
    await this.currentPassword.fill(current)
    await this.newPassword.fill(next)
    await this.confirmPassword.fill(confirmation)
    await this.save.click()
  }
}

export type WalletInput = {
  nickname: string
  address: string
  network: NetworkName
  provider?: WalletProviderName
  displayName?: string
  profileName?: string
  email?: string
  ensLabel?: string
  referralCode?: string
}

/** Carteiras (`/perfil/carteiras`): principal e secundária, com o formulário do Pagamento. */
export class WalletsPage {
  static readonly path = '/perfil/carteiras'

  readonly heading: Locator
  readonly secondaryEmpty: Locator
  /** Usuário sem carteira (ex.: Bia) vê "Adicionar" também na principal. */
  readonly addPrimary: Locator
  readonly addSecondary: Locator
  readonly saved: Locator

  private readonly page: Page

  constructor(page: Page) {
    this.page = page
    this.heading = page.getByRole('heading', { name: 'Carteiras', level: 1 })
    this.secondaryEmpty = page.getByText('Você ainda não adicionou uma carteira secundária.')
    this.addPrimary = page.getByRole('button', { name: 'Adicionar carteira principal' })
    this.addSecondary = page.getByRole('button', { name: 'Adicionar carteira secundária' })
    this.saved = page.getByRole('status').filter({ hasText: 'Carteira salva.' })
  }

  slot(name: 'Carteira principal' | 'Carteira secundária'): WalletForm {
    return new WalletForm(this.page, this.page.getByRole('region', { name }))
  }
}

export class WalletForm {
  readonly root: Locator
  readonly displayName: Locator
  readonly nickname: Locator
  readonly profileName: Locator
  readonly address: Locator
  readonly secondaryAddressOrEns: Locator
  readonly referralCode: Locator
  readonly email: Locator
  readonly ensName: Locator
  readonly networkSelect: Locator
  readonly providerSelect: Locator
  /** Só na secundária: copia os dados de colecionador da principal. */
  readonly sameAsPrimary: Locator
  readonly save: Locator
  readonly remove: Locator

  private readonly page: Page

  constructor(page: Page, root: Locator) {
    this.page = page
    this.root = root
    this.displayName = root.getByRole('textbox', { name: 'Nome de exibição' })
    this.nickname = root.getByRole('textbox', { name: 'Apelido da carteira' })
    this.profileName = root.getByRole('textbox', { name: 'Nome do perfil' })
    this.address = root.getByRole('textbox', { name: 'Endereço da carteira' })
    this.secondaryAddressOrEns = root.getByRole('textbox', { name: 'ENS ou carteira secundária (opcional)' })
    this.referralCode = root.getByRole('textbox', { name: 'Código de indicação' })
    this.email = root.getByRole('textbox', { name: 'E-mail' })
    this.ensName = root.getByRole('textbox', { name: 'Nome ENS' })
    this.networkSelect = root.getByRole('combobox', { name: 'Rede' })
    this.providerSelect = root.getByRole('combobox', { name: 'Tipo de carteira' })
    this.sameAsPrimary = root.getByRole('checkbox', { name: 'Igual à carteira principal' })
    this.save = root.getByRole('button', { name: 'Salvar carteira' })
    this.remove = root.getByRole('button', { name: 'Remover carteira' })
  }

  /** Select do shadcn: as opções abrem num portal fora da região. */
  async chooseNetwork(network: NetworkName): Promise<void> {
    await this.networkSelect.click()
    await this.page.getByRole('option', { name: network, exact: true }).click()
  }

  async chooseProvider(provider: WalletProviderName): Promise<void> {
    await this.providerSelect.click()
    await this.page.getByRole('option', { name: provider, exact: true }).click()
  }

  /** Preenche só o que vier; campos de colecionador ausentes ficam como estão. */
  async fill(data: WalletInput): Promise<void> {
    await this.nickname.fill(data.nickname)
    await this.chooseNetwork(data.network)
    await this.address.fill(data.address)
    if (data.provider) await this.chooseProvider(data.provider)
    if (data.displayName !== undefined) await this.displayName.fill(data.displayName)
    if (data.profileName !== undefined) await this.profileName.fill(data.profileName)
    if (data.email !== undefined) await this.email.fill(data.email)
    if (data.ensLabel !== undefined) await this.ensName.fill(data.ensLabel)
    if (data.referralCode !== undefined) await this.referralCode.fill(data.referralCode)
  }
}
