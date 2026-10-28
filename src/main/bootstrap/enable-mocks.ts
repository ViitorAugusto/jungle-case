/**
 * Liga o MSW. O import dinâmico mantém os mocks fora do bundle quando
 * desativados. Ao terminar, marca `<html data-mocks="ready">` (sinal de pronto
 * para os testes).
 *
 * `search` são os parâmetros de cenário da URL de entrada, capturados no boot:
 * a interface sobe antes e um redirecionamento de rota pode trocar a URL.
 */
export const enableMocks = async (search: string): Promise<void> => {
  const { worker, prepareMockServer } = await import('@mocks/browser')
  prepareMockServer(search)
  await worker.start({
    onUnhandledRequest: 'bypass',
    quiet: !import.meta.env.DEV,
    serviceWorker: { url: `${import.meta.env.BASE_URL}mockServiceWorker.js` },
  })
  document.documentElement.dataset.mocks = 'ready'
}
