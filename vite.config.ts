import { fileURLToPath, URL } from 'node:url'

import tailwindcss from '@tailwindcss/vite'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const fromSrc = (path: string) => fileURLToPath(new URL(`./src/${path}`, import.meta.url))

export default defineConfig({
  plugins: [
    tanstackRouter({
      target: 'react',
      autoCodeSplitting: true,
      routesDirectory: './src/presentation/routes',
      generatedRouteTree: './src/presentation/route-tree.gen.ts',
    }),
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@domain': fromSrc('domain'),
      '@application': fromSrc('application'),
      '@adapters': fromSrc('adapters'),
      '@infra': fromSrc('infra'),
      '@main': fromSrc('main'),
      '@presentation': fromSrc('presentation'),
      '@mocks': fromSrc('mocks'),
      // Só o cookie jar do MSW usa o `tough-cookie`; a API simulada não usa cookies.
      'tough-cookie': fromSrc('mocks/shims/tough-cookie.ts'),
    },
  },
  server: { port: 5173, strictPort: true },
  preview: { port: 4173, strictPort: true },
})
