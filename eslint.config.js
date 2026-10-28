import js from '@eslint/js'
import prettier from 'eslint-config-prettier'
import boundaries from 'eslint-plugin-boundaries'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'
import globals from 'globals'
import tseslint from 'typescript-eslint'

/** Camadas (ver ARCHITECTURE.md). Dependências apontam apenas para dentro. */
const layers = [
  { type: 'domain', pattern: 'src/domain' },
  { type: 'application', pattern: 'src/application' },
  { type: 'adapters', pattern: 'src/adapters' },
  { type: 'infra', pattern: 'src/infra' },
  { type: 'main', pattern: 'src/main' },
  { type: 'presentation', pattern: 'src/presentation' },
  { type: 'mocks', pattern: 'src/mocks' },
]

const forbid = (from, to) => ({
  from: { element: { type: from } },
  disallow: { to: { element: { types: { anyOf: to } } } },
})

/** Bibliotecas de transporte só podem aparecer em adaptadores, infraestrutura e mocks. */
const transportLibraries = {
  paths: [
    { name: 'axios', message: 'REST só via adaptadores HTTP (src/adapters) e instância em src/infra/http.' },
    { name: 'socket.io-client', message: 'Socket.IO só via adaptadores (src/adapters) e src/infra/socket.' },
    { name: 'msw', message: 'MSW só em src/mocks.' },
  ],
}

export default defineConfig([
  globalIgnores([
    'dist',
    'coverage',
    'playwright-report',
    'test-results',
    'public/mockServiceWorker.js',
    'src/presentation/route-tree.gen.ts',
  ]),
  {
    files: ['**/*.{js,mjs}'],
    extends: [js.configs.recommended],
    languageOptions: { globals: globals.node },
  },
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.strictTypeChecked,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2023,
      globals: globals.browser,
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
    rules: {
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/restrict-template-expressions': ['error', { allowNumber: true }],
    },
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    plugins: { boundaries },
    settings: {
      'boundaries/elements': layers,
      'import/resolver': { typescript: { project: './tsconfig.app.json' } },
    },
    rules: {
      'boundaries/dependencies': [
        'error',
        {
          default: 'allow',
          policies: [
            forbid('domain', ['application', 'adapters', 'infra', 'main', 'presentation', 'mocks']),
            forbid('application', ['adapters', 'infra', 'main', 'presentation', 'mocks']),
            forbid('adapters', ['infra', 'main', 'presentation', 'mocks']),
            forbid('infra', ['domain', 'application', 'adapters', 'main', 'presentation', 'mocks']),
            forbid('presentation', ['domain', 'adapters', 'infra', 'mocks']),
            forbid('mocks', ['domain', 'application', 'infra', 'main', 'presentation']),
          ],
        },
      ],
    },
  },
  {
    files: ['src/{domain,application,presentation}/**/*.{ts,tsx}'],
    rules: { 'no-restricted-imports': ['error', transportLibraries] },
  },
  {
    // Rotas file-based exportam `Route`; componentes shadcn exportam também as variantes.
    files: ['src/presentation/routes/**/*.tsx', 'src/presentation/components/ui/**/*.tsx'],
    rules: { 'react-refresh/only-export-components': 'off' },
  },
  {
    files: ['*.ts', 'tests/**/*.ts'],
    languageOptions: { globals: globals.node },
  },
  prettier,
])
