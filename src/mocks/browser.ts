import { setupWorker } from 'msw/browser'

import { db } from '@mocks/db/database'
import { handlers } from '@mocks/handlers'
import { applyScenarioFromUrl } from '@mocks/scenarios/scenarios'
import { settleDueOrders } from '@mocks/services/payments'

export const worker = setupWorker(...handlers)

/**
 * Prepara o servidor simulado antes do primeiro request: aplica cenário e
 * parâmetros da URL (`?scenario=`, `?mockReset=1`...) e retoma pagamentos
 * pendentes interrompidos por um refresh.
 */
export const prepareMockServer = (search: string): void => {
  if (applyScenarioFromUrl(search)) db.reset()
  settleDueOrders()
}
