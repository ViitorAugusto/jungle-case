/** Configuração de ambiente lida uma única vez e exposta tipada ao restante da aplicação. */
export type AppEnv = {
  readonly enableMocks: boolean
  readonly apiBaseUrl: string
  readonly socketUrl: string
}

const readEnv = (): AppEnv => ({
  enableMocks: import.meta.env.VITE_ENABLE_MOCKS === 'true',
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || '/api',
  socketUrl: import.meta.env.VITE_SOCKET_URL || window.location.origin,
})

export const env: AppEnv = readEnv()
