import { CatalogSection, MobileCatalogBar } from '@presentation/components/catalog/catalog-section'
import { HomeBlog } from '@presentation/components/home/home-blog'
import { HomeHero } from '@presentation/components/home/home-hero'
import { HomePromos } from '@presentation/components/home/home-promos'
import { useFeaturedNfts } from '@presentation/hooks/use-catalog'

/**
 * Início (Figma "Desktop / Início" e "Mobile / Início"): hero com destaques,
 * catálogo com filtros na URL, promoções e o diário editorial.
 */
export function HomeScreen() {
  const featured = useFeaturedNfts()

  return (
    <div className="mx-auto flex w-full max-w-content flex-col gap-4 px-6 md:gap-24 md:px-10 xl:px-0">
      <MobileCatalogBar />
      <HomeHero featured={featured.data} />
      <CatalogSection sideFeatured={featured.data?.[1] ?? featured.data?.[0]} />
      <HomePromos />
      <HomeBlog />
    </div>
  )
}
