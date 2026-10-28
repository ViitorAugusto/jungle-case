/** Resumo de valores calculado pela API (cotação é a referência; o cliente não recalcula). */
export type PriceSummary = {
  readonly subtotalEth: string
  readonly discountEth: string
  readonly networkFeeEth: string
  readonly totalEth: string
}

export type CouponKind = 'percentage' | 'fixed'

export type AppliedCoupon = {
  readonly code: string
  readonly kind: CouponKind
  /** Pontos-base para `percentage` (1000 = 10%) ou ETH em string para `fixed`. */
  readonly value: string
  readonly description: string
}
