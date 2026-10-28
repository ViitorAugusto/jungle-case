import type { Page } from '@playwright/test'

/**
 * Animações zeradas e seções `defer-render` (content-visibility: auto) sempre
 * renderizadas: a captura de página inteira não rola, então o navegador não
 * pintaria o que está abaixo da dobra.
 */
const FREEZE_STYLES = `
  *, *::before, *::after {
    animation-duration: 0s !important;
    animation-delay: 0s !important;
    transition-duration: 0s !important;
    transition-delay: 0s !important;
    caret-color: transparent !important;
  }
  .defer-render {
    content-visibility: visible !important;
  }
`

/**
 * Deixa a página estável para captura: animações e transições zeradas,
 * conteúdo abaixo da dobra renderizado, fontes carregadas e todas as imagens
 * (inclusive as lazy, carregadas ao rolar) decodificadas.
 */
export const prepareForScreenshot = async (page: Page): Promise<void> => {
  await page.addStyleTag({ content: FREEZE_STYLES })
  await page.evaluate(async () => {
    const step = window.innerHeight
    for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
      window.scrollTo(0, y)
      await new Promise((resolve) => requestAnimationFrame(resolve))
    }
    window.scrollTo(0, 0)
  })
  await page.waitForLoadState('networkidle')
  await page.evaluate(async () => {
    await document.fonts.ready
    // Carrosséis rolam na horizontal: rolar a página não carrega as imagens lazy fora da tela.
    for (const image of Array.from(document.images)) {
      if (image.loading === 'lazy') image.loading = 'eager'
    }
    await Promise.all(
      Array.from(document.images).map((image) =>
        image.complete
          ? Promise.resolve()
          : new Promise((resolve) => {
              image.addEventListener('load', resolve, { once: true })
              image.addEventListener('error', resolve, { once: true })
            }),
      ),
    )
  })
}
