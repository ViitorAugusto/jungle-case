/**
 * Antecipa o código da tela de entrada. Com code splitting por rota, o router
 * só descobre a tela depois de o shell ser avaliado, o que soma uma ida e volta
 * de rede antes da primeira pintura útil. Aqui as telas de entrada mais comuns
 * (Início e detalhe, as auditadas pelo Lighthouse) começam a baixar junto com o
 * shell. O chunk é o mesmo que a rota importa, então não há download duplicado.
 */
export const preloadEntryRoute = (pathname: string): void => {
  if (pathname === '/') void import('@presentation/screens/home-screen')
  else if (pathname.startsWith('/nfts/')) void import('@presentation/screens/nft-detail-screen')
}
