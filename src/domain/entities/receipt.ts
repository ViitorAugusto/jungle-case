import { walletProviderLabels } from '@domain/entities/checkout-form'
import type { OrderCollector, OrderLine, OrderPayment, OrderTransaction } from '@domain/entities/order'
import type { AppliedCoupon, PriceSummary } from '@domain/entities/pricing'

/**
 * Recibo: cópia imutável do pedido no momento da confirmação. Mudanças
 * posteriores de preço ou catálogo não alteram o que foi comprado.
 */
export type Receipt = {
  readonly orderId: string
  readonly issuedAt: string
  readonly transaction: OrderTransaction
  readonly lines: readonly OrderLine[]
  readonly coupon: AppliedCoupon | null
  readonly summary: PriceSummary
  readonly collector: OrderCollector
  readonly payment: OrderPayment
}

/** "Carteira" do recibo: o provedor usado no pagamento (MetaMask, WalletConnect, Coinbase Wallet). */
export const receiptWalletLabel = (receipt: Pick<Receipt, 'payment'>) =>
  walletProviderLabels[receipt.payment.provider]
