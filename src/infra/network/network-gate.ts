let ready: Promise<void> = Promise.resolve()

/**
 * Segura o tráfego da API (REST e Socket.IO) até a promessa resolver. Usado na
 * inicialização: a interface já pode ser montada enquanto o MSW sobe, e nenhuma
 * requisição sai antes de os mocks estarem interceptando. Se a promessa
 * rejeitar, as requisições falham com o mesmo erro.
 */
export const holdNetworkUntil = (promise: Promise<void>): void => {
  ready = promise
}

export const networkReady = (): Promise<void> => ready
