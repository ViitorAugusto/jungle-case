import type { CheckoutFormValues } from '@domain/entities/checkout-form'

/**
 * Dados já preenchidos no pagamento, preservados se a sessão expirar no meio
 * do checkout. Mesmo formato do pedido, mais a escolha "Usar outra carteira?".
 */
export type CheckoutDraft = CheckoutFormValues & {
  readonly useOtherWallet: boolean
}

export interface CheckoutDraftStorage {
  load(): CheckoutDraft | null
  save(draft: CheckoutDraft): void
  clear(): void
}
