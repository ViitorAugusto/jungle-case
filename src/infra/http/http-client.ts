import axios, { type AxiosInstance } from 'axios'

import { env } from '@infra/config/env'
import { networkReady } from '@infra/network/network-gate'

const REQUEST_TIMEOUT_MS = 10_000

/**
 * Instância única do Axios. Toda chamada REST passa por ela; interceptors de
 * sessão e de tradução de erros são registrados aqui pelo composition root.
 */
export const httpClient: AxiosInstance = axios.create({
  baseURL: env.apiBaseUrl,
  timeout: REQUEST_TIMEOUT_MS,
  headers: { 'Content-Type': 'application/json' },
})

// Nenhuma requisição sai antes de a rede ser liberada (`network-gate.ts`). O
// timeout só conta a partir do envio, depois desta espera.
httpClient.interceptors.request.use(async (config) => {
  await networkReady()
  return config
})
