import { useState } from 'react'

import { isEditionAvailable, type Nft } from '@application/dtos'

import { EditionPicker } from '@presentation/components/nft/edition-picker'
import { FavoriteButton } from '@presentation/components/nft/favorite-button'
import { networkLabels } from '@presentation/components/nft/network-labels'
import { NftGallery } from '@presentation/components/nft/nft-gallery'
import { NftMobileTopBar } from '@presentation/components/nft/nft-mobile-top-bar'
import { NftPurchase } from '@presentation/components/nft/nft-purchase'
import { QuantityStepper } from '@presentation/components/nft/quantity-stepper'
import { EthValue } from '@presentation/components/ui/eth-value'
import { tokenIdOf } from '@presentation/lib/token-id'

/** Primeira edição disponível (ou a primeira, se tudo esgotou). */
const defaultEditionId = (nft: Nft) => (nft.editions.find(isEditionAvailable) ?? nft.editions[0])?.id ?? ''

/**
 * Bloco principal do detalhe: galeria à esquerda; nome, preço, descrição,
 * edição, quantidade e compra à direita. No mobile vira a "folha" do Figma
 * sobre a arte, com a barra de compra fixa no rodapé.
 */
export function NftOverview({ nft }: { readonly nft: Nft }) {
  const [editionId, setEditionId] = useState(() => defaultEditionId(nft))
  const [requested, setRequested] = useState(1)
  const edition = nft.editions.find((item) => item.id === editionId) ?? nft.editions[0]
  const available = edition?.available ?? 0
  // Tempo real pode reduzir a disponibilidade: a quantidade acompanha o novo limite.
  const quantity = Math.max(1, Math.min(requested, available))

  return (
    <div className="relative flex flex-col md:gap-8 lg:flex-row lg:items-start">
      <div className="-mx-6 bg-linear-145 from-surface-card to-surface-raised px-6 pt-12 pb-10 md:mx-0 md:bg-none md:p-0 lg:w-143 lg:shrink-0">
        <NftMobileTopBar nft={nft} />
        <NftGallery nft={nft} />
      </div>

      <div className="-mx-6 -mt-8 flex min-w-0 flex-1 flex-col gap-5 rounded-t-sheet bg-surface-card px-6 pt-8 pb-48 md:mx-0 md:mt-0 md:justify-between md:rounded-none md:bg-transparent md:p-0 lg:min-h-112">
        <div className="flex flex-col gap-3">
          <h1 className="text-title leading-6 font-bold text-foreground md:text-heading-lg">{nft.name}</h1>
          <p
            className="hidden items-baseline gap-3 text-title leading-4 font-bold text-text-accent md:flex"
            aria-live="polite"
          >
            {edition ? <EthValue amount={edition.priceEth} /> : null}
            {edition?.compareAtPriceEth ? (
              <span className="text-lead font-normal text-subtle line-through">
                <span className="sr-only">Preço anterior: </span>
                <EthValue amount={edition.compareAtPriceEth} />
              </span>
            ) : null}
          </p>
        </div>
        <hr className="hidden border-primary/40 md:block" />
        <div className="flex flex-col gap-3">
          <h2 className="hidden text-body leading-4 font-bold text-foreground md:block">Sobre este NFT:</h2>
          <p className="text-body-sm leading-6 text-text-secondary">{nft.description}</p>
        </div>

        <EditionPicker
          editions={nft.editions}
          value={edition?.id ?? ''}
          onChange={(next) => {
            setEditionId(next)
            setRequested(1)
          }}
        />
        <p className="text-body-sm text-text-secondary" aria-live="polite">
          {available > 0
            ? `${available} de ${edition?.supply ?? 0} disponíveis nesta edição`
            : 'Edição esgotada'}
        </p>

        {/* Barra de compra: fixa no rodapé no mobile (Figma "Buy Bar"), em linha no desktop. */}
        <div className="fixed inset-x-0 bottom-0 z-30 flex flex-col gap-5 rounded-t-sheet bg-surface-card px-6 pt-5 pb-9 shadow-field md:static md:flex-row md:items-center md:justify-between md:gap-4 md:rounded-none md:bg-transparent md:p-0 md:shadow-none">
          <div className="flex items-center justify-between">
            <QuantityStepper
              value={quantity}
              max={available}
              onChange={setRequested}
              disabled={available === 0}
            />
            <p className="text-title leading-4 font-bold text-text-accent md:hidden" aria-hidden="true">
              {edition ? <EthValue amount={edition.priceEth} /> : null}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <NftPurchase nft={nft} edition={edition} quantity={quantity} className="flex-1 md:flex-none" />
            <FavoriteButton nft={nft} labeled className="hidden md:flex" />
          </div>
        </div>

        <dl className="flex flex-col gap-3 text-body text-subtle">
          <div className="flex gap-1">
            <dt>ID do token:</dt>
            <dd>{tokenIdOf(nft.id)}</dd>
          </div>
          <div className="flex gap-1">
            <dt>Coleção:</dt>
            <dd>{nft.collection.name}</dd>
          </div>
          <div className="flex gap-1">
            <dt>Rede:</dt>
            <dd>{networkLabels[nft.network]}</dd>
          </div>
          <div className="flex gap-1">
            <dt>Criador:</dt>
            <dd>{nft.creator.name}</dd>
          </div>
        </dl>
      </div>
    </div>
  )
}
