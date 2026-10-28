import type { AppliedCoupon, PriceSummary } from '@domain/entities/pricing'
import { EthAmount } from '@domain/value-objects/eth-amount'

export type CartLine = {
  /** Identidade da linha: uma por NFT + edição. */
  readonly id: string
  readonly nftId: string
  readonly editionId: string
  /** Número do token exibido como "ID do token" (ex.: `#0042`). */
  readonly tokenId: string
  readonly nftName: string
  readonly editionName: string
  /** Tiragem da edição (`null` = aberta), exibida como "1/50" ou "ABERTA". */
  readonly editionSupply: number | null
  readonly imageUrl: string
  readonly unitPriceEth: string
  readonly quantity: number
  /** Estoque atual da edição, para limitar a quantidade na interface. */
  readonly available: number
  readonly lineTotalEth: string
}

export type Cart = {
  readonly owner: 'guest' | 'user'
  readonly lines: readonly CartLine[]
  readonly coupon: AppliedCoupon | null
  readonly summary: PriceSummary
  readonly itemCount: number
  readonly version: number
}

export type CartChange =
  | {
      readonly kind: 'price'
      readonly lineId: string
      readonly nftName: string
      readonly previousEth: string
      readonly currentEth: string
    }
  | {
      readonly kind: 'availability'
      readonly lineId: string
      readonly nftName: string
      readonly previous: number
      readonly current: number
    }
  | { readonly kind: 'removed'; readonly lineId: string; readonly nftName: string }

export const cartLineId = (nftId: string, editionId: string) => `${nftId}:${editionId}`

export const isCartEmpty = (cart: Cart) => cart.lines.length === 0

/** Contador do badge do carrinho: itens distintos (linhas), não unidades. */
export const cartBadgeCount = (cart: Pick<Cart, 'lines'>) => cart.lines.length

/** Linhas cuja quantidade passou do estoque atual (ex.: edição esgotou com o carrinho aberto). */
export const linesOverAvailability = (cart: Cart): readonly CartLine[] =>
  cart.lines.filter((line) => line.quantity > line.available)

/**
 * Compara duas leituras do carrinho e lista o que mudou por fora da ação do usuário:
 * preço unitário, disponibilidade da edição e linhas removidas pelo servidor.
 */
export const diffCart = (previous: Cart, next: Cart): readonly CartChange[] => {
  const nextById = new Map(next.lines.map((line) => [line.id, line]))
  const changes: CartChange[] = []

  for (const before of previous.lines) {
    const after = nextById.get(before.id)
    if (!after) {
      changes.push({ kind: 'removed', lineId: before.id, nftName: before.nftName })
      continue
    }
    if (!EthAmount.of(before.unitPriceEth).equals(EthAmount.of(after.unitPriceEth))) {
      changes.push({
        kind: 'price',
        lineId: after.id,
        nftName: after.nftName,
        previousEth: before.unitPriceEth,
        currentEth: after.unitPriceEth,
      })
    }
    if (before.available !== after.available) {
      changes.push({
        kind: 'availability',
        lineId: after.id,
        nftName: after.nftName,
        previous: before.available,
        current: after.available,
      })
    }
  }

  return changes
}
