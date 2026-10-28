import type { WalletDraft } from '@application/dtos'

/** Campos que "Igual à carteira principal" copia e trava (apelido, rede e endereço são próprios). */
export const COLLECTOR_FIELDS: readonly (keyof WalletDraft)[] = [
  'displayName',
  'profileName',
  'email',
  'ensName',
  'referralCode',
  'provider',
]
