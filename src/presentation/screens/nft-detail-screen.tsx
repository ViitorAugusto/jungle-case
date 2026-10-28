import { getRouteApi, Link } from '@tanstack/react-router'

import { StatePanel } from '@presentation/components/feedback/state-panel'
import { Breadcrumb } from '@presentation/components/layout/breadcrumb'
import { CATALOG_ANCHOR } from '@presentation/components/layout/nav-items'
import { NftDetailSkeleton } from '@presentation/components/nft/nft-detail-skeleton'
import { NftDetailsSection } from '@presentation/components/nft/nft-details-section'
import { NftOverview } from '@presentation/components/nft/nft-overview'
import { RelatedNfts } from '@presentation/components/nft/related-nfts'
import { Button } from '@presentation/components/ui/button'
import { useNft } from '@presentation/hooks/use-catalog'
import { isNotFound } from '@presentation/lib/errors'

const routeApi = getRouteApi('/nfts/$nftId')

const breadcrumb = [{ label: 'Início' }, { label: 'Mercado', hash: CATALOG_ANCHOR }] as const

/** Detalhe do NFT (Figma "Desktop / Detalhes do NFT" e "Mobile / Detalhes do NFT"). */
export function NftDetailScreen() {
  const { nftId } = routeApi.useParams()
  const nft = useNft(nftId)

  return (
    <div className="mx-auto w-full max-w-content px-6 md:px-10 xl:px-0">
      {nft.data ? (
        <div key={nft.data.id} className="flex flex-col gap-12 md:gap-24">
          <div className="flex flex-col gap-3">
            <Breadcrumb items={breadcrumb} />
            <NftOverview nft={nft.data} />
          </div>
          <NftDetailsSection nft={nft.data} />
          <RelatedNfts nft={nft.data} />
        </div>
      ) : nft.isError && isNotFound(nft.error) ? (
        <StatePanel
          title={<h1 className="text-heading font-bold text-foreground">NFT não encontrado</h1>}
          description="O NFT procurado não existe ou foi removido do catálogo."
          actions={
            <Button asChild>
              <Link to="/" hash={CATALOG_ANCHOR}>
                Voltar ao catálogo
              </Link>
            </Button>
          }
        />
      ) : nft.isError ? (
        <StatePanel
          role="alert"
          title={<p className="text-lead font-bold text-foreground">Não foi possível carregar este NFT.</p>}
          actions={<Button onClick={() => void nft.refetch()}>Tentar novamente</Button>}
        />
      ) : (
        <NftDetailSkeleton />
      )}
    </div>
  )
}
