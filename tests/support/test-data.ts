import { fixtureIds } from '../../src/mocks/db/fixture-ids.ts'

/** Identificadores estáveis do cenário conhecido, mantidos junto das fixtures do MSW. */
export const testData = {
  ...fixtureIds,
  wallets: {
    ...fixtureIds.wallets,
    /** Apelido da carteira principal do Alex: nome do radio no pagamento. */
    alexPrimaryNickname: 'Cofre do Alex',
  },
} as const
