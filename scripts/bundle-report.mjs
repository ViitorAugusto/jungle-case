// Relatório do caminho crítico de JS a partir do manifesto do Vite.
// Mede, em bytes brutos e gzip:
//   - entrada: o que o index.html carrega de forma estática;
//   - mocks: o que o bootstrap baixa antes de montar a aplicação (só com MSW ativo);
//   - app: o shell da aplicação (start-app e dependências estáticas);
//   - cada rota auditada: o chunk lazy da rota e o que ele traz a mais.
// Uso: npm run bundle:report [-- --skip-build] [-- --json]

import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { gzipSync } from 'node:zlib'

const root = path.resolve(import.meta.dirname, '..')
const dist = path.join(root, 'dist')
const args = new Set(process.argv.slice(2))

if (!args.has('--skip-build')) {
  const result = spawnSync('npm', ['run', 'build', '--', '--manifest'], {
    cwd: root,
    stdio: 'inherit',
    shell: true,
  })
  if (result.status !== 0) process.exit(result.status ?? 1)
}

const manifest = JSON.parse(readFileSync(path.join(dist, '.vite', 'manifest.json'), 'utf8'))

const sizeOf = (file) => {
  const content = readFileSync(path.join(dist, file))
  return { raw: content.length, gzip: gzipSync(content, { level: 9 }).length }
}

/** Fecho de imports estáticos de uma entrada do manifesto (o que o navegador baixa junto). */
const staticClosure = (key, seen = new Set()) => {
  if (seen.has(key)) return seen
  seen.add(key)
  for (const dependency of manifest[key]?.imports ?? []) staticClosure(dependency, seen)
  return seen
}

const findKey = (predicate, label) => {
  const key = Object.keys(manifest).find(predicate)
  if (!key) throw new Error(`Entrada não encontrada no manifesto: ${label}`)
  return key
}

const total = (keys, exclude = new Set()) =>
  [...keys]
    .filter((key) => !exclude.has(key) && manifest[key].file.endsWith('.js'))
    .reduce(
      (sum, key) => {
        const size = sizeOf(manifest[key].file)
        return {
          raw: sum.raw + size.raw,
          gzip: sum.gzip + size.gzip,
          files: [...sum.files, manifest[key].file],
        }
      },
      { raw: 0, gzip: 0, files: [] },
    )

const entryKey = findKey((key) => manifest[key].isEntry, 'entrada')
const mocksKey = findKey((key) => key.endsWith('src/mocks/browser.ts'), 'src/mocks/browser.ts')
const appKey = findKey((key) => key.endsWith('src/main/start-app.tsx'), 'src/main/start-app.tsx')
const routeKeys = {
  home: findKey((key) => key.includes('routes/index.tsx'), 'rota /'),
  detalhe: findKey((key) => key.includes('routes/nfts.$nftId.tsx'), 'rota /nfts/$nftId'),
}

const entry = staticClosure(entryKey)
const mocks = staticClosure(mocksKey)
const app = staticClosure(appKey)
const loaded = new Set([...entry, ...app])

const report = {
  entry: total(entry),
  mocks: total(mocks, entry),
  app: total(app, entry),
  routes: Object.fromEntries(
    Object.entries(routeKeys).map(([name, key]) => [name, total(staticClosure(key), loaded)]),
  ),
}

const kb = (bytes) => `${(bytes / 1024).toFixed(1)} KB`
const line = (label, { raw, gzip }) => `${label.padEnd(34)} ${kb(raw).padStart(10)} ${kb(gzip).padStart(10)}`

if (args.has('--json')) {
  console.log(JSON.stringify(report, null, 2))
} else {
  const sum = (...parts) =>
    parts.reduce((acc, part) => ({ raw: acc.raw + part.raw, gzip: acc.gzip + part.gzip }), {
      raw: 0,
      gzip: 0,
    })
  console.log(`\n${'Trecho'.padEnd(34)} ${'bruto'.padStart(10)} ${'gzip'.padStart(10)}`)
  console.log(line('entrada (index.html)', report.entry))
  console.log(line('mocks (MSW, só no demo)', report.mocks))
  console.log(line('shell da aplicação', report.app))
  for (const [name, size] of Object.entries(report.routes)) console.log(line(`rota ${name} (a mais)`, size))
  console.log('')
  for (const [name, size] of Object.entries(report.routes)) {
    console.log(line(`crítico ${name} sem mocks`, sum(report.entry, report.app, size)))
    console.log(line(`crítico ${name} com mocks`, sum(report.entry, report.mocks, report.app, size)))
  }
}
