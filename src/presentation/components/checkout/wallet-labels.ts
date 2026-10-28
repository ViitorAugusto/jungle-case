import type { WalletSlot } from '@application/dtos'

/** Figma mobile: "Reserva" antes de "Principal". */
export const walletSlotLabels: Record<WalletSlot, string> = { secondary: 'Reserva', primary: 'Principal' }
