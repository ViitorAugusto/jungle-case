import { defineConfig, devices } from '@playwright/test'

const PORT = 4173
const baseURL = `http://localhost:${PORT}`

/**
 * Testes ponta a ponta contra o build de demonstração (MSW ativo).
 * Chromium desktop (1440) e mobile (390); relatório HTML e trace na primeira
 * nova tentativa. Baselines de regressão visual versionadas em
 * `tests/e2e/__screenshots__`, separadas por projeto e sistema operacional
 * (a renderização de fontes muda entre plataformas).
 */
export default defineConfig({
  testDir: './tests/e2e',
  outputDir: './test-results',
  snapshotPathTemplate: '{testDir}/__screenshots__/{projectName}/{testFilePath}/{arg}-{platform}{ext}',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  reporter: [['html', { open: 'never', outputFolder: 'playwright-report' }], ['list']],
  expect: {
    toHaveScreenshot: {
      animations: 'disabled',
      caret: 'hide',
      scale: 'css',
      maxDiffPixelRatio: 0.01,
    },
  },
  use: {
    baseURL,
    locale: 'pt-BR',
    timezoneId: 'America/Sao_Paulo',
    reducedMotion: 'reduce',
    serviceWorkers: 'allow',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium-desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
    },
    {
      name: 'chromium-mobile',
      use: { ...devices['Pixel 7'], viewport: { width: 390, height: 844 } },
    },
  ],
  webServer: {
    command: 'npm run build && npm run preview',
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
})
