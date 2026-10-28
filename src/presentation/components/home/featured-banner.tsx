import { Link } from '@tanstack/react-router'

import type { Nft } from '@application/dtos'

import { NftImage } from '@presentation/components/nft/nft-image'
import { Skeleton } from '@presentation/components/ui/skeleton'

/** Card "NFT EM DESTAQUE / OFERTA LIMITADA" abaixo dos filtros (desktop). */
export function FeaturedBanner({ nft }: { readonly nft: Nft | undefined }) {
  return (
    <section
      aria-labelledby="destaque-lateral"
      className="flex flex-col gap-4 bg-linear-to-b from-primary/10 to-primary/3 pt-6 pb-1"
    >
      <div className="flex flex-col gap-4 px-5">
        <h2 id="destaque-lateral" className="text-heading font-bold text-text-accent">
          NFT EM DESTAQUE
        </h2>
        <p className="text-center text-title leading-4 font-bold text-foreground">OFERTA LIMITADA</p>
      </div>
      {nft ? (
        <Link
          to="/nfts/$nftId"
          params={{ nftId: nft.id }}
          aria-label={`Ver ${nft.name}`}
          className="block overflow-hidden rounded-3xl focus-ring"
        >
          <NftImage image={nft.images[0]} sizes="310px" className="aspect-310/368 w-full" />
        </Link>
      ) : (
        <Skeleton className="aspect-310/368 w-full rounded-3xl" />
      )}
    </section>
  )
}
