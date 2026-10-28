// Gera as variantes responsivas das artes de NFT a partir dos originais do Figma
// (assets/figma/nfts, PNG 1254x1254) em public/images/nfts: AVIF, WebP e JPEG
// (fallback) em várias larguras. Uso: npm run images:nfts
import { mkdirSync, readdirSync } from 'node:fs'
import { basename, extname, join } from 'node:path'
import sharp from 'sharp'

const SOURCE_DIR = join('assets', 'figma', 'nfts')
const OUTPUT_DIR = join('public', 'images', 'nfts')
/** Larguras usadas pelos `sizes` da interface (cards, galeria, hero; telas 1x e 2x). */
export const WIDTHS = [160, 320, 480, 640, 960]
const FORMATS = [
  ['avif', { quality: 50, effort: 6 }],
  ['webp', { quality: 72 }],
  ['jpeg', { quality: 78, mozjpeg: true }],
]

mkdirSync(OUTPUT_DIR, { recursive: true })

for (const file of readdirSync(SOURCE_DIR).filter((name) => extname(name) === '.png')) {
  const name = basename(file, '.png')
  for (const width of WIDTHS) {
    for (const [format, options] of FORMATS) {
      const extension = format === 'jpeg' ? 'jpg' : format
      const target = join(OUTPUT_DIR, `${name}-${width}.${extension}`)
      await sharp(join(SOURCE_DIR, file)).resize(width, width).toFormat(format, options).toFile(target)
    }
  }
  console.log(`${name}: ${WIDTHS.length * FORMATS.length} variantes`)
}
