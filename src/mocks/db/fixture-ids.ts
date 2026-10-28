/**
 * Identificadores estáveis das fixtures, para testes (sem imports, para que os
 * testes Playwright possam importar fora dos aliases do app). Derivados das
 * regras de `fixtures.ts`: `nft-011` tem todas as edições esgotadas; `nft-001`
 * tem a edição "Rara" esgotada e as demais disponíveis.
 */
export const fixtureIds = {
  users: {
    alex: { id: 'usr_alex', name: 'Alex Rocha', email: 'alex@jungle.test', password: 'Jungle@123' },
    bia: { id: 'usr_bia', name: 'Bia Lima', email: 'bia@jungle.test', password: 'Jungle@456' },
  },
  nfts: {
    available: { id: 'nft-002', editionId: 'nft-002-std' },
    partiallySoldOut: { id: 'nft-001', availableEditionId: 'nft-001-std', soldOutEditionId: 'nft-001-rare' },
    soldOut: { id: 'nft-011', editionId: 'nft-011-std' },
    missing: { id: 'nft-999' },
  },
  coupons: { valid: 'JUNGLE10', fixed: 'ETH005', expired: 'EXPIRADO20', invalid: 'NAOEXISTE' },
  wallets: { alexPrimaryAddress: '0x1111111111111111111111111111111111111111' },
} as const
