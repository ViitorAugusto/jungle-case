import { descriptionParagraphs, type Nft } from '@application/dtos'

import { networkLabels } from '@presentation/components/nft/network-labels'
import { NftReviewsList } from '@presentation/components/nft/nft-reviews-list'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@presentation/components/ui/tabs'
import { shortenHash } from '@presentation/lib/format'

/**
 * Abas abaixo da compra (desktop): "Detalhes do NFT" (descrição em parágrafos,
 * rede, contrato e direitos autorais) e "Avaliações de colecionadores (N)".
 */
export function NftDetailsSection({ nft }: { readonly nft: Nft }) {
  const { provenance } = nft
  const facts = [
    {
      term: 'Rede:',
      detail: `Cunhado na ${networkLabels[nft.network]} com procedência imutável e metadados armazenados no ${provenance.metadataStorage}.`,
    },
    {
      term: 'Contrato:',
      detail: `${shortenHash(provenance.contractAddress).replace('…', '...')} • Contrato inteligente ${provenance.tokenStandard} verificado.`,
    },
    {
      term: 'Direitos autorais:',
      detail: `Direitos autorais do criador: ${String(provenance.royaltyPercent)}% nas vendas secundárias, pagos automaticamente pelos mercados compatíveis.`,
    },
  ]

  return (
    <section aria-label="Informações do NFT" className="hidden md:block">
      <Tabs defaultValue="detalhes" className="gap-3.5">
        <TabsList variant="underline" aria-label="Informações do NFT">
          <TabsTrigger value="detalhes">Detalhes do NFT</TabsTrigger>
          <TabsTrigger value="avaliacoes">Avaliações de colecionadores ({nft.rating.count})</TabsTrigger>
        </TabsList>
        <TabsContent value="detalhes" className="flex flex-col text-body-sm leading-6">
          <div className="flex flex-col gap-6 text-text-secondary">
            {descriptionParagraphs(nft).map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
          <dl>
            {facts.map((fact) => (
              <div key={fact.term} className="mt-3">
                <dt className="font-bold text-foreground">{fact.term}</dt>
                <dd className="text-text-secondary">{fact.detail}</dd>
              </div>
            ))}
          </dl>
        </TabsContent>
        <TabsContent value="avaliacoes">
          <NftReviewsList nftId={nft.id} />
        </TabsContent>
      </Tabs>
    </section>
  )
}
