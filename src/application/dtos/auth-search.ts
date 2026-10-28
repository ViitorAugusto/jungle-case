/** Search params das telas de login e cadastro. */
export type AuthSearch = {
  /** Caminho interno para onde voltar depois de entrar (ex.: `/checkout`). */
  readonly redirect?: string
  /** A sessão anterior expirou: a tela avisa "Sua sessão expirou". */
  readonly expired?: true
}

export const DEFAULT_AFTER_LOGIN = '/'

/**
 * Aceita só caminhos internos (`/algo`). Rejeita URL absoluta, `//host` e
 * `/\host`, que levariam o usuário para fora da aplicação após o login.
 */
export const safeRedirectPath = (value: unknown): string | undefined => {
  if (typeof value !== 'string') return undefined
  const path = value.trim()
  if (!path.startsWith('/') || path.startsWith('//') || path.startsWith('/\\')) return undefined
  return path
}

/** `validateSearch` de `/login` e `/cadastro`. */
export const parseAuthSearch = (raw: Record<string, unknown>): AuthSearch => {
  const redirect = safeRedirectPath(raw.redirect)
  const expired = raw.expired === true || raw.expired === 'true' || raw.expired === '1'
  return {
    ...(redirect && redirect !== DEFAULT_AFTER_LOGIN ? { redirect } : {}),
    ...(expired ? { expired: true } : {}),
  }
}

/** Destino após entrar ou se cadastrar. */
export const afterLoginPath = (search: AuthSearch): string => search.redirect ?? DEFAULT_AFTER_LOGIN
