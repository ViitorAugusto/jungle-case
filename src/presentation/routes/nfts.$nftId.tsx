import { createFileRoute } from '@tanstack/react-router'

import { catalogQueries } from '@main/query/catalog-queries'
import { NFT_DETAIL_IMAGE_SIZES, preloadNftImage } from '@presentation/lib/responsive-image'
import { NftDetailScreen } from '@presentation/screens/nft-detail-screen'

export const Route = createFileRoute('/nfts/$nftId')({
  // Prefetch sem esperar: o detalhe sai junto com o código da tela. Na
  // navegação de fato (não no preload por hover), a imagem principal começa a
  // baixar assim que o dado chega, sem esperar a tela renderizar. A falha fica
  // no cache e a tela cuida dela.
  loader: ({ context: { queryClient }, params, preload }) => {
    void queryClient
      .query(catalogQueries.nft(queryClient, params.nftId))
      .then((nft) => {
        const image = nft.images[0]
        if (!preload && image) preloadNftImage(image.url, NFT_DETAIL_IMAGE_SIZES)
      })
      .catch(() => undefined)
  },
  component: NftDetailScreen,
})
