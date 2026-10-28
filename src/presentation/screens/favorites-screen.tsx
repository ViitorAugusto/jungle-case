import { Link } from '@tanstack/react-router'
import { HeartIcon } from 'lucide-react'

import { DEFAULT_PAGE_SIZE } from '@application/dtos'

import { NftCardSkeleton } from '@presentation/components/catalog/catalog-results'
import { StatePanel } from '@presentation/components/feedback/state-panel'
import { CATALOG_ANCHOR } from '@presentation/components/layout/nav-items'
import { NftCard } from '@presentation/components/nft/nft-card'
import { Button } from '@presentation/components/ui/button'
import { useFavorites } from '@presentation/hooks/use-favorites'

const gridClass = 'grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 md:gap-x-8 lg:grid-cols-4'

/** Favoritos do colecionador (rota privada). Desfavoritar aqui remove o card na hora (otimista). */
export function FavoritesScreen() {
  const favorites = useFavorites()

  return (
    <div className="mx-auto flex w-full max-w-content flex-col gap-8 px-6 md:px-10 xl:px-0">
      <header className="flex flex-col gap-2">
        <h1 className="text-heading-lg font-bold text-foreground">Favoritos</h1>
        <p className="text-body-sm text-text-secondary">NFTs que você salvou para acompanhar.</p>
      </header>

      {favorites.isError && !favorites.data ? (
        <StatePanel
          role="alert"
          title={
            <p className="text-lead font-bold text-foreground">Não foi possível carregar seus favoritos.</p>
          }
          actions={<Button onClick={() => void favorites.refetch()}>Tentar novamente</Button>}
        />
      ) : !favorites.data ? (
        <ul aria-label="Favoritos" aria-busy="true" className={gridClass}>
          {Array.from({ length: DEFAULT_PAGE_SIZE }, (_, index) => (
            <li key={index}>
              <NftCardSkeleton />
            </li>
          ))}
        </ul>
      ) : favorites.data.length === 0 ? (
        <StatePanel
          icon={<HeartIcon aria-hidden="true" className="size-10 text-text-accent" />}
          title={<h2 className="text-title font-bold text-foreground">Nenhum favorito ainda</h2>}
          description="Toque em Favoritar no detalhe de um NFT para guardá-lo aqui."
          actions={
            <Button asChild>
              <Link to="/" hash={CATALOG_ANCHOR}>
                Explorar o catálogo
              </Link>
            </Button>
          }
        />
      ) : (
        <ul aria-label="Favoritos" className={gridClass}>
          {favorites.data.map((favorite) => (
            <li key={favorite.nftId}>
              <NftCard nft={favorite.nft} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
