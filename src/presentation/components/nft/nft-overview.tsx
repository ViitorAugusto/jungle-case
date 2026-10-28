import { StarIcon } from 'lucide-react'
import { useState } from 'react'

import { isEditionAvailable, type Nft } from '@application/dtos'

import { EditionPicker } from '@presentation/components/nft/edition-picker'
import { FavoriteButton } from '@presentation/components/nft/favorite-button'
import { NftGallery } from '@presentation/components/nft/nft-gallery'
import { NftMobileTopBar } from '@presentation/components/nft/nft-mobile-top-bar'
import { NftPurchase } from '@presentation/components/nft/nft-purchase'
import { NftShare } from '@presentation/components/nft/nft-share'
import { QuantityStepper } from '@presentation/components/nft/quantity-stepper'
import { RatingStars } from '@presentation/components/nft/rating-stars'
import { EthValue } from '@presentation/components/ui/eth-value'
import { formatRating } from '@presentation/lib/format'

/** Primeira edição disponível (ou a primeira, se tudo esgotou). */
const defaultEditionId = (nft: Nft) => (nft.editions.find(isEditionAvailable) ?? nft.editions[0])?.id ?? ''

const reviewsLabel = (count: number) =>
  count === 1 ? '1 avaliação de colecionador' : `${String(count)} avaliações de colecionadores`

/**
 * Bloco principal do detalhe: galeria à esquerda; nome, preço com avaliação,
 * "Sobre este NFT", edição, quantidade e compra, metadados e compartilhar à
 * direita. No mobile vira a "folha" do Figma sobre a arte, com o selo de
 * avaliação ao lado do nome e a barra de compra fixa no rodapé.
 */
export function NftOverview({ nft }: { readonly nft: Nft }) {
  const [editionId, setEditionId] = useState(() => defaultEditionId(nft))
  const [requested, setRequested] = useState(1)
  const edition = nft.editions.find((item) => item.id === editionId) ?? nft.editions[0]
  const available = edition?.available ?? 0
  // Tempo real pode reduzir a disponibilidade: a quantidade acompanha o novo limite.
  const quantity = Math.max(1, Math.min(requested, available))
  const rating = `Nota ${formatRating(nft.rating.average)} de 5, ${reviewsLabel(nft.rating.count)}`

  return (
    <div className="relative flex flex-col md:gap-8 lg:flex-row lg:items-start">
      <div className="relative -mx-6 -mt-6 bg-linear-145 from-surface-card to-surface-raised px-6.75 pt-16.5 md:mx-0 md:mt-0 md:bg-none md:p-0 lg:w-143 lg:shrink-0">
        <NftMobileTopBar nft={nft} />
        <NftGallery nft={nft} />
      </div>

      <div className="relative -mx-6 -mt-8.5 flex min-w-0 flex-1 flex-col rounded-t-sheet bg-surface-card px-6 pt-8.5 pb-48 md:mx-0 md:mt-0 md:rounded-none md:bg-transparent md:p-0 md:pt-1.5">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-title leading-6 font-bold text-foreground md:text-heading-lg">{nft.name}</h1>
          {/* Mobile: selo "★ 4.8(19)" ao lado do nome. */}
          <p
            aria-label={rating}
            className="flex h-6.5 shrink-0 items-center gap-1 rounded-full border border-primary px-2 text-caption text-foreground md:hidden"
          >
            <StarIcon aria-hidden="true" strokeWidth={0} className="size-3.5 fill-primary" />
            <span aria-hidden="true">
              {formatRating(nft.rating.average)}
              <span className="text-text-secondary">({nft.rating.count})</span>
            </span>
          </p>
        </div>
        <div className="mt-3 hidden h-7 items-center justify-between gap-4 md:flex">
          <p
            className="flex items-baseline gap-3 text-title leading-4 font-bold text-text-accent"
            aria-live="polite"
          >
            {edition ? <EthValue amount={edition.priceEth} /> : null}
            {edition?.compareAtPriceEth ? (
              <span className="text-lead font-normal text-subtle">
                <span className="sr-only">Preço anterior: </span>
                <EthValue amount={edition.compareAtPriceEth} />
              </span>
            ) : null}
          </p>
          <p
            aria-label={rating}
            className="flex items-center gap-1 text-body whitespace-nowrap text-foreground"
          >
            <RatingStars value={nft.rating.average} />
            <span aria-hidden="true">{reviewsLabel(nft.rating.count)}</span>
          </p>
        </div>
        <hr className="mt-1.5 hidden border-primary/25 md:block" />
        <h2 className="mt-3.25 hidden text-body leading-5 font-bold text-foreground md:block">
          Sobre este NFT:
        </h2>
        <p className="mt-3 text-body-sm leading-6 text-text-secondary md:mt-2.25">{nft.summary}</p>

        <div className="mt-3 md:mt-2">
          <EditionPicker
            editions={nft.editions}
            value={edition?.id ?? ''}
            onChange={(next) => {
              setEditionId(next)
              setRequested(1)
            }}
          />
        </div>
        {available === 0 ? (
          <p className="mt-2 text-body-sm text-destructive-foreground" aria-live="polite">
            Edição esgotada
          </p>
        ) : null}

        {/* Barra de compra: fixa no rodapé no mobile (Figma "Buy Bar"), em linha no desktop. */}
        <div className="fixed inset-x-0 bottom-0 z-30 flex flex-col gap-5 rounded-t-sheet bg-surface-card px-6 pt-5 pb-9 shadow-field md:static md:mt-4 md:h-12 md:flex-row md:items-center md:justify-between md:gap-4 md:rounded-none md:bg-transparent md:p-0 md:shadow-none">
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
            <NftPurchase nft={nft} edition={edition} quantity={quantity} />
            <FavoriteButton nft={nft} labeled className="hidden md:flex" />
          </div>
        </div>

        <dl className="mt-3 flex flex-col text-body leading-8 text-subtle md:mt-2">
          <div className="flex gap-2">
            <dt>ID do token:</dt>
            <dd>{nft.tokenId}</dd>
          </div>
          <div className="flex gap-2">
            <dt>Coleção:</dt>
            <dd>{nft.series.name}</dd>
          </div>
          {nft.attributes.length > 0 ? (
            <div className="flex gap-2">
              <dt>Atributos:</dt>
              <dd>{nft.attributes.join(', ')}</dd>
            </div>
          ) : null}
        </dl>
        <NftShare nft={nft} className="mt-1.25 flex items-center gap-2" />
      </div>
    </div>
  )
}
