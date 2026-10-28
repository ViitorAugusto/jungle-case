// Adiciona componentes shadcn/ui e normaliza o import de `cn` para o alias do projeto.
// O registry publica alguns componentes com `import { cn } from "cn"`, que não existe aqui.
import { execSync } from 'node:child_process'
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const components = process.argv.slice(2)
if (components.length === 0) {
  console.error('Uso: npm run ui:add -- <componente> [outros...]')
  process.exit(1)
}

execSync(`npx --yes shadcn@latest add ${components.join(' ')} --yes`, { stdio: 'inherit' })

const uiDir = join('src', 'presentation', 'components', 'ui')
for (const file of readdirSync(uiDir)) {
  const path = join(uiDir, file)
  const source = readFileSync(path, 'utf8')
  const fixed = source.replace(/from ["']cn["']/g, "from '@presentation/lib/utils'")
  if (fixed !== source) writeFileSync(path, fixed)
}

const pkg = JSON.parse(readFileSync('package.json', 'utf8'))
if (pkg.dependencies?.cn) execSync('npm uninstall cn', { stdio: 'inherit' })
