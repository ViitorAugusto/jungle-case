// Configuração versionada da auditoria Lighthouse (ver ARCHITECTURE.md, seção "Testes e auditoria").

export const lighthouseConfig = {
  port: 4173,
  runs: 3,
  outputDir: 'lighthouse-reports',
  // Cenário padrão dos mocks: perfil novo do navegador a cada execução, sem `?scenario=`.
  pages: [
    { id: 'home', path: '/' },
    { id: 'detalhe', path: '/nfts/nft-002' },
  ],
  formFactors: ['mobile', 'desktop'],
  categories: ['performance', 'accessibility', 'best-practices', 'seo'],
  targets: {
    performance: 90,
    accessibility: 95,
    'best-practices': 95,
    seo: 90,
  },
  metrics: {
    lcp: 'largest-contentful-paint',
    cls: 'cumulative-layout-shift',
    tbt: 'total-blocking-time',
    fcp: 'first-contentful-paint',
    si: 'speed-index',
  },
  chromeFlags: ['--headless=new', '--no-first-run', '--no-default-browser-check', '--disable-extensions'],
}
