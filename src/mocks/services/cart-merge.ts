import type { CartLineRecord } from '@mocks/db/database'

export type MergeableCart = {
  readonly lines: readonly CartLineRecord[]
  readonly couponCode: string | null
}

/** Estoque atual de uma edição; 0 ou `undefined` = esgotada ou inexistente. */
export type AvailabilityLookup = (nftId: string, editionId: string) => number | undefined

/**
 * Mescla o carrinho do visitante no do usuário (R19), sem efeitos colaterais:
 * - mesma edição nos dois: soma as quantidades sem passar do estoque;
 * - edição só no visitante: entra limitada ao estoque;
 * - edição esgotada ou inexistente: a linha do visitante é ignorada;
 * - linhas que só o usuário tem ficam como estão;
 * - cupom do usuário prevalece; sem cupom, herda o do visitante.
 */
export const mergeGuestIntoUserCart = (
  user: MergeableCart,
  guest: MergeableCart,
  availableOf: AvailabilityLookup,
): MergeableCart => {
  const lines = user.lines.map((line) => ({ ...line }))
  for (const guestLine of guest.lines) {
    const available = availableOf(guestLine.nftId, guestLine.editionId) ?? 0
    if (available <= 0) continue
    const existing = lines.find(
      (line) => line.nftId === guestLine.nftId && line.editionId === guestLine.editionId,
    )
    if (existing) existing.quantity = Math.min(existing.quantity + guestLine.quantity, available)
    else lines.push({ ...guestLine, quantity: Math.min(guestLine.quantity, available) })
  }
  return { lines, couponCode: user.couponCode ?? guest.couponCode }
}
