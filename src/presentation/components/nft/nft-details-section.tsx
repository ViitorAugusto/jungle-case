import type { Nft } from '@application/dtos'

import { networkLabels } from '@presentation/components/nft/network-labels'

/** Bloco "Detalhes do NFT" abaixo da compra (desktop). A aba de avaliações do Figma está fora do escopo. */
export function NftDetailsSection({ nft }: { readonly nft: Nft }) {
  return (
    <section aria-labelledby="detalhes-titulo" className="hidden flex-col gap-3 md:flex">
      <div className="border-b border-primary/40">
        <h2
          id="detalhes-titulo"
          className="inline-block border-b-3 border-primary pb-2 text-lead-sm font-bold text-text-accent"
        >
          Detalhes do NFT
        </h2>
      </div>
      <p className="text-body-sm leading-6 text-text-secondary">{nft.description}</p>
      <dl className="text-body-sm leading-6">
        <dt className="font-bold text-foreground">Rede:</dt>
        <dd className="text-text-secondary">
          Cunhado na {networkLabels[nft.network]} com procedência imutável e metadados armazenados no IPFS.
        </dd>
        <dt className="font-bold text-foreground">Coleção:</dt>
        <dd className="text-text-secondary">{nft.collection.name}</dd>
        <dt className="font-bold text-foreground">Criador:</dt>
        <dd className="text-text-secondary">{nft.creator.name}</dd>
      </dl>
    </section>
  )
}
