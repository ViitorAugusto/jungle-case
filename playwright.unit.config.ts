import { defineConfig } from '@playwright/test'

/**
 * Testes unitários de domínio, casos de uso e adaptadores, com fakes em
 * memória das portas. Rodam no Node pelo runner do Playwright (sem navegador
 * nem servidor); `tsconfig.unit.json` resolve os aliases de camada.
 */
export default defineConfig({
  testDir: './tests/unit',
  // Pasta própria: o test-results/ do E2E (traces de falha) não é apagado ao rodar a unidade.
  outputDir: './test-results/unit',
  tsconfig: './tsconfig.unit.json',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  reporter: [['list']],
})
