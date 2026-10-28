/**
 * Artes dos NFTs otimizadas por `npm run images:nfts` (originais do Figma em
 * assets/figma/nfts). Cada arte existe como `<nome>-<largura>.<avif|webp|jpg>`;
 * a API envia a variante JPEG de 640 px (`/images/nfts/kurio-nft-1-640.jpg`),
 * que serve de fallback, e a interface monta o `srcset` das demais.
 */
export const NFT_IMAGE_WIDTHS = [160, 320, 480, 640, 960] as const

const VARIANT_PATTERN = /^(\/images\/nfts\/[\w-]+)-\d+\.jpg$/

export type ResponsiveSources = {
  readonly avif: string
  readonly webp: string
  readonly jpg: string
}

const srcSet = (base: string, extension: string) =>
  NFT_IMAGE_WIDTHS.map((width) => `${base}-${width}.${extension} ${width}w`).join(', ')

/** `srcset` por formato para uma URL de arte; `null` para imagens fora do padrão (ex.: avatar). */
export const responsiveSources = (url: string): ResponsiveSources | null => {
  const base = VARIANT_PATTERN.exec(url)?.[1]
  if (!base) return null
  return { avif: srcSet(base, 'avif'), webp: srcSet(base, 'webp'), jpg: srcSet(base, 'jpg') }
}

/** `sizes` da imagem principal do detalhe; o preload do loader precisa do mesmo valor. */
export const NFT_DETAIL_IMAGE_SIZES = '(min-width: 768px) 404px, calc(100vw - 48px)'

const preloaded = new Set<string>()

/**
 * Antecipa o download de uma arte com `<link rel="preload">`, escolhendo a
 * mesma variante AVIF que o `<picture>` vai pedir (mesmo `srcset` e `sizes`),
 * para o navegador reaproveitar o download em vez de baixar duas vezes.
 */
export const preloadNftImage = (url: string, sizes: string): void => {
  const sources = responsiveSources(url)
  if (!sources || preloaded.has(url)) return
  preloaded.add(url)
  const link = document.createElement('link')
  link.rel = 'preload'
  link.as = 'image'
  link.type = 'image/avif'
  link.imageSrcset = sources.avif
  link.imageSizes = sizes
  link.fetchPriority = 'high'
  document.head.append(link)
}

/** URL da variante padrão de uma das 4 artes do Figma (usada em promoções e no diário). */
export const kurioArt = (index: 1 | 2 | 3 | 4): string => `/images/nfts/kurio-nft-${index}-640.jpg`
