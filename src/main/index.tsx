import { enableMocks } from '@main/bootstrap/enable-mocks'
import { preloadEntryRoute } from '@main/bootstrap/preload-entry-route'

import { env } from '@infra/config/env'
import { holdNetworkUntil } from '@infra/network/network-gate'

/**
 * A interface não espera o MSW para aparecer: o shell e o MSW são baixados em
 * paralelo, o shell é montado assim que chega, e o tráfego da API (REST e
 * Socket.IO) fica retido até os mocks estarem interceptando
 * (`network-gate.ts`). Nenhuma requisição escapa dos mocks. Os parâmetros de
 * cenário são capturados aqui, antes que um redirecionamento troque a URL.
 */
if (env.enableMocks) holdNetworkUntil(enableMocks(window.location.search))

void import('@main/start-app').then(({ startApp }) => {
  startApp()
})
preloadEntryRoute(window.location.pathname)
