import type { NftNetwork } from '@application/dtos'

export const networkLabels: Record<NftNetwork, string> = {
  ethereum: 'Ethereum',
  polygon: 'Polygon',
  solana: 'Solana',
}

/** Explorador de blocos de cada rede (link simulado do recibo: "Ver no Etherscan"). */
export const explorerLabels: Record<NftNetwork, string> = {
  ethereum: 'Etherscan',
  polygon: 'Polygonscan',
  solana: 'Solscan',
}

/** Rótulo de uma rede vinda de formulário (texto livre); `null` se não for suportada. */
export const networkLabelOf = (value: string): string | null =>
  value in networkLabels ? networkLabels[value as NftNetwork] : null

/** Opções do select "Rede" (pagamento e carteiras). */
export const networkOptions = (Object.keys(networkLabels) as NftNetwork[]).map((network) => ({
  value: network,
  label: networkLabels[network],
}))
