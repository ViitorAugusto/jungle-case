import type { Locator, Page } from '@playwright/test'

export type NetworkName = 'Ethereum' | 'Polygon' | 'Solana'
export type WalletProviderName = 'MetaMask' | 'WalletConnect' | 'Coinbase Wallet'

/** Campos do "Perfil do colecionador" que não vêm do perfil (premissa 23). */
export type CollectorInput = {
  username: string
  profileName: string
  /** Só o rótulo: o sufixo `.eth` é fixo na interface. */
  ensLabel: string
  referralCode: string
  note?: string
}

/**
 * Pagamento (`/checkout`), textos do Figma (premissas 17 e 23). Desktop: o
 * "Perfil do colecionador" chega pré-preenchido do perfil e da carteira
 * principal ("Tipo de carteira" escolhe a carteira cadastrada; "Usar outra
 * carteira?" libera rede e endereço). Mobile: só "Carteira conectada",
 * "Carteira e rede", o total e o botão. Um único "Confirmar compra" conecta,
 * cota, revalida e envia; se algo mudou, o diálogo "Revise as mudanças" pede
 * nova confirmação.
 */
export class CheckoutPage {
  static readonly path = '/checkout'

  readonly displayName: Locator
  readonly username: Locator
  readonly profileName: Locator
  readonly email: Locator
  readonly ensName: Locator
  readonly referralCode: Locator
  readonly walletAddress: Locator
  readonly secondaryWallet: Locator
  readonly note: Locator
  readonly networkSelect: Locator
  /** Carteira cadastrada escolhida no formulário (desktop). */
  readonly savedWalletSelect: Locator
  /** Carteiras cadastradas em cards (mobile). */
  readonly savedWallets: Locator
  readonly useOtherWallet: Locator
  readonly walletTypes: Locator
  readonly disconnectWallet: Locator
  readonly walletConnected: Locator
  readonly walletRejected: Locator
  readonly summaryRegion: Locator
  readonly confirm: Locator
  readonly changesDialog: Locator
  readonly confirmChanges: Locator
  readonly pending: Locator
  readonly rejected: Locator
  readonly quoteChanged: Locator
  readonly soldOut: Locator
  readonly retry: Locator
  readonly reviewAgain: Locator
  readonly recovering: Locator

  private readonly page: Page

  constructor(page: Page) {
    this.page = page
    this.displayName = page.getByRole('textbox', { name: 'Nome de exibição' })
    this.username = page.getByRole('textbox', { name: 'Nome de usuário' })
    this.profileName = page.getByRole('textbox', { name: 'Nome do perfil' })
    this.email = page.getByRole('textbox', { name: 'E-mail' })
    this.ensName = page.getByRole('textbox', { name: 'Nome ENS' })
    this.referralCode = page.getByRole('textbox', { name: 'Código de indicação' })
    this.walletAddress = page.getByRole('textbox', { name: 'Endereço da carteira' })
    this.secondaryWallet = page.getByRole('textbox', { name: 'ENS ou carteira secundária (opcional)' })
    this.note = page.getByRole('textbox', { name: 'Observação do colecionador (opcional)' })
    this.networkSelect = page.getByRole('combobox', { name: 'Rede' })
    this.savedWalletSelect = page.getByRole('combobox', { name: 'Tipo de carteira' })
    this.savedWallets = page.getByRole('radiogroup', { name: 'Carteira conectada' })
    this.useOtherWallet = page.getByRole('checkbox', { name: 'Usar outra carteira?' })
    this.walletTypes = page.getByRole('radiogroup', { name: 'Carteira e rede' })
    this.disconnectWallet = page.getByRole('button', { name: 'Desconectar carteira' })
    this.walletConnected = page.getByRole('status').filter({ hasText: 'Carteira conectada' })
    this.walletRejected = page.getByRole('alert').filter({ hasText: 'Conexão recusada' })
    this.summaryRegion = page.getByRole('region', { name: 'Seus NFTs' })
    this.confirm = page.getByRole('button', { name: 'Confirmar compra' })
    this.changesDialog = page.getByRole('dialog', { name: 'Revise as mudanças' })
    this.confirmChanges = this.changesDialog.getByRole('button', { name: 'Confirmar compra' })
    this.pending = page.getByRole('status').filter({ hasText: 'Pagamento pendente' })
    this.rejected = page.getByRole('alert').filter({ hasText: 'Pagamento recusado' })
    this.quoteChanged = page.getByRole('alert').filter({ hasText: /mudou|mudaram|alterad/i })
    this.soldOut = page.getByRole('alert').filter({ hasText: /esgotou/i })
    this.retry = page.getByRole('button', { name: 'Tentar novamente' })
    this.reviewAgain = page.getByRole('button', { name: 'Revisar novamente' })
    // Premissa 25: recuperação automática após timeout, anunciada em região viva.
    this.recovering = page
      .getByRole('status')
      .filter({ hasText: 'A confirmação demorou. Recuperando seu pedido' })
  }

  /** Card de carteira cadastrada (mobile): "Principal, alexrocha.eth, …". */
  savedWallet(label: string | RegExp): Locator {
    return this.savedWallets.getByRole('radio', { name: label })
  }

  /** Escolhe a carteira cadastrada pelo apelido no select "Tipo de carteira" (desktop). */
  async chooseSavedWallet(nickname: string) {
    await this.savedWalletSelect.click()
    await this.page.getByRole('option', { name: new RegExp(`· ${nickname}$`) }).click()
  }

  walletType(name: WalletProviderName): Locator {
    return this.walletTypes.getByRole('radio', { name })
  }

  /**
   * Completa o colecionador (desktop; no mobile o formulário não aparece e os
   * dados vêm do perfil) e escolhe o provedor. Trocar de provedor conecta a
   * carteira cadastrada; com `connect` espera a conexão. Mantido o provedor
   * salvo, a conexão acontece no "Confirmar compra".
   */
  async fillPayment(
    collector: CollectorInput,
    provider: WalletProviderName = 'MetaMask',
    { connect = true }: { connect?: boolean } = {},
  ) {
    if (await this.username.isVisible()) {
      await this.username.fill(collector.username)
      await this.profileName.fill(collector.profileName)
      await this.ensName.fill(collector.ensLabel)
      await this.referralCode.fill(collector.referralCode)
      if (collector.note) await this.note.fill(collector.note)
    }
    const card = this.walletType(provider)
    if (await card.isChecked()) return
    await card.click()
    if (connect) await this.walletConnected.waitFor()
  }

  /** Libera rede e endereço manuais ("Usar outra carteira?"). */
  async useWallet(network: NetworkName, address: string) {
    await this.useOtherWallet.check()
    await this.networkSelect.click()
    await this.page.getByRole('option', { name: network }).click()
    await this.walletAddress.fill(address)
  }

  /** "Confirmar compra" habilitado; desabilita enquanto conecta, cota ou o pedido está pendente. */
  enabledConfirm(): Locator {
    return this.confirm.and(this.page.locator(':enabled'))
  }
}

/** Confirmação / recibo (`/pedidos/$orderId`), card central do Figma. */
export class ReceiptPage {
  static path(orderId: string): string {
    return `/pedidos/${orderId}`
  }

  readonly confirmed: Locator
  readonly pending: Locator
  readonly rejected: Locator
  /** ID da transação (hash completo para leitor de tela), Data, Total e Carteira. */
  readonly transaction: Locator
  readonly explorerLink: Locator
  readonly details: Locator
  readonly items: Locator
  readonly close: Locator

  constructor(page: Page) {
    this.confirmed = page.getByRole('heading', { name: 'Seus NFTs agora estão na sua carteira' })
    this.pending = page.getByRole('status').filter({ hasText: 'Pagamento pendente' })
    this.rejected = page.getByRole('alert').filter({ hasText: 'Pagamento recusado' })
    this.transaction = page.getByRole('region', { name: 'Transação', exact: true })
    this.explorerLink = page.getByRole('link', { name: /^Ver no (Etherscan|Polygonscan|Solscan)/ })
    this.details = page.getByRole('region', { name: 'Detalhes da transação' })
    this.items = this.details.getByRole('list', { name: 'Itens comprados' }).getByRole('listitem')
    this.close = page.getByRole('button', { name: 'Fechar' })
  }
}
