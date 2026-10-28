// Gera a fonte de texto da interface a partir do Roboto Mono variável do
// @fontsource (face latin): mesma cobertura de caracteres do original, com o
// eixo de peso limitado a 400–700, os pesos que a interface usa. Uso: npm run fonts:subset
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import subsetFont from 'subset-font'

const SOURCE = join(
  'node_modules',
  '@fontsource-variable',
  'roboto-mono',
  'files',
  'roboto-mono-latin-wght-normal.woff2',
)
const TARGET = join('src', 'presentation', 'styles', 'fonts', 'roboto-mono-latin-wght-400-700.woff2')

/** `unicode-range` da face latin do @fontsource; repetido no @font-face de globals.css. */
const RANGES = [
  [0x0000, 0x00ff],
  [0x0131],
  [0x0152, 0x0153],
  [0x02bb, 0x02bc],
  [0x02c6],
  [0x02da],
  [0x02dc],
  [0x0304],
  [0x0308],
  [0x0329],
  [0x2000, 0x206f],
  [0x20ac],
  [0x2122],
  [0x2191],
  [0x2193],
  [0x2212],
  [0x2215],
  [0xfeff],
  [0xfffd],
]

let text = ''
for (const [start, end = start] of RANGES) {
  for (let code = start; code <= end; code++) text += String.fromCodePoint(code)
}

const source = readFileSync(SOURCE)
const subset = await subsetFont(source, text, {
  targetFormat: 'woff2',
  variationAxes: { wght: { min: 400, max: 700 } },
})

mkdirSync(dirname(TARGET), { recursive: true })
writeFileSync(TARGET, subset)
console.log(`${TARGET}: ${source.length} -> ${subset.length} bytes`)
