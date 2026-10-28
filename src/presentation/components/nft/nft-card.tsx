import { Link } from '@tanstack/react-router'

import { isSoldOut, lowestPriceEth, type Nft } from '@application/dtos'

import { FavoriteButton } from '@presentation/components/nft/favorite-button'
import { NftImage } from '@presentation/components/nft/nft-image'
import { Badge } from '@presentation/components/ui/badge'
import { EthValue } from '@presentation/components/ui/eth-value'

type NftCardProps = {
  readonly nft: Nft
  /** Favorito sobre a arte (mobile). Desligado onde a página já tem um "Favoritar" principal. */
  readonly showFavorite?: boolean
  /** Card da primeira linha visível: arte sem lazy e com prioridade alta (LCP). */
  readonly priority?: boolean
}

/** Preço anterior da edição mais barata disponível (exibido riscado, como no Figma). */
const compareAtPrice = (nft: Nft, price: string | null): string | null =>
  nft.editions.find((edition) => edition.priceEth === price)?.compareAtPriceEth ?? null

/**
 * Card do catálogo. O nome é um heading com link para o detalhe; o link cobre
 * o card inteiro (pseudo-elemento) e o botão de favorito fica acima dele.
 * Desktop: moldura Surface Card 258×300 com a arte 250×250. Mobile: moldura
 * com gradiente, cantos de 20 px e favorito no canto da arte.
 */
export function NftCard({ nft, showFavorite = true, priority = false }: NftCardProps) {
  const price = lowestPriceEth(nft)
  const previous = compareAtPrice(nft, price)
  const soldOut = isSoldOut(nft)

  return (
    <article className="group relative flex flex-col gap-2 md:gap-3">
      <div className="relative flex aspect-175/200 items-center justify-center rounded-2xl bg-linear-145 from-surface-card to-surface-raised px-1 md:aspect-258/300 md:items-start md:rounded-none md:bg-surface-card md:bg-none md:pt-8">
        <NftImage
          image={nft.images[0]}
          decorative
          priority={priority}
          sizes="(min-width: 1280px) 250px, (min-width: 768px) 30vw, calc(50vw - 40px)"
          className="w-full rounded-xl transition-transform duration-300 group-hover:scale-102"
        />
        {soldOut ? (
          <Badge className="absolute top-3 left-0 rounded-none px-2 py-1.5 md:top-4">Esgotado</Badge>
        ) : null}
        {showFavorite ? (
          <FavoriteButton nft={nft} className="absolute top-4 right-3 size-7 md:hidden" />
        ) : null}
      </div>

      <div className="flex flex-col gap-1 pl-2 md:gap-3 md:pl-0">
        <h3 className="truncate text-body text-foreground md:text-body-lg md:leading-4">
          <Link
            to="/nfts/$nftId"
            params={{ nftId: nft.id }}
            className="outline-none after:absolute after:inset-0 after:rounded-2xl after:content-[''] focus-visible:after:outline-2 focus-visible:after:outline-offset-4 focus-visible:after:outline-ring md:after:rounded-none"
          >
            {nft.name}
          </Link>
        </h3>
        <p className="flex items-baseline gap-2 text-body-lg leading-4 font-bold text-text-accent md:text-lead md:leading-4">
          {price ? <EthValue amount={price} /> : null}
          {previous ? (
            <span className="font-normal text-subtle line-through">
              <span className="sr-only">Preço anterior: </span>
              <EthValue amount={previous} />
            </span>
          ) : null}
          {soldOut ? <span className="sr-only">(esgotado)</span> : null}
        </p>
      </div>
    </article>
  )
}
