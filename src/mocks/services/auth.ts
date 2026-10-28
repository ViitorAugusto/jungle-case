import type { SessionDto, UserDto } from '@adapters/http/contracts'

import { db, type SessionRecord } from '@mocks/db/database'
import type { UserRecord } from '@mocks/db/fixtures'
import { ApiError } from '@mocks/http/respond'
import { scenarios } from '@mocks/scenarios/scenarios'

const REFRESH_TTL_MS = 7 * 86_400_000

const toHex = (buffer: ArrayBuffer) =>
  Array.from(new Uint8Array(buffer), (byte) => byte.toString(16).padStart(2, '0')).join('')

/** SHA-256 de `salt:senha`. Senhas nunca ficam em claro no estado simulado. */
export const hashPassword = async (salt: string, password: string) =>
  toHex(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${salt}:${password}`)))

export const verifyPassword = async (user: UserRecord, password: string) =>
  (await hashPassword(user.salt, password)) === user.passwordHash

export const toUserDto = (user: UserRecord): UserDto => ({
  id: user.id,
  name: user.name,
  email: user.email,
  avatarUrl: user.avatarUrl,
})

const toSessionDto = (session: SessionRecord, user: UserRecord): SessionDto => ({
  user: toUserDto(user),
  accessToken: session.currentAccessToken,
  refreshToken: session.refreshToken,
  accessExpiresAt: session.accessExpiresAt,
  refreshExpiresAt: session.refreshExpiresAt,
})

const accessExpiry = () => new Date(Date.now() + scenarios.config.accessTokenTtlMs).toISOString()

export const openSession = (user: UserRecord): SessionDto => {
  const accessToken = `at_${crypto.randomUUID()}`
  const session: SessionRecord = {
    id: `ses_${crypto.randomUUID()}`,
    userId: user.id,
    accessTokens: [accessToken],
    currentAccessToken: accessToken,
    refreshToken: `rt_${crypto.randomUUID()}`,
    accessExpiresAt: accessExpiry(),
    refreshExpiresAt: new Date(Date.now() + REFRESH_TTL_MS).toISOString(),
    createdAt: new Date().toISOString(),
    revoked: false,
  }
  db.state.sessions.push(session)
  return toSessionDto(session, user)
}

/** Sessão viva: não revogada, refresh válido e não atingida pelo cenário `session-expired`. */
const isAlive = (session: SessionRecord) =>
  !session.revoked &&
  new Date(session.refreshExpiresAt).getTime() > Date.now() &&
  !(scenarios.is('session-expired') && session.createdAt < scenarios.config.activatedAt)

const sessionExpired = () =>
  new ApiError(401, 'SESSION_EXPIRED', 'Sua sessão expirou. Entre novamente para continuar')

export const refreshSession = (refreshToken: string): SessionDto => {
  const session = db.state.sessions.find((candidate) => candidate.refreshToken === refreshToken)
  const user = session ? db.findUser(session.userId) : undefined
  if (!session || !user || !isAlive(session)) throw sessionExpired()

  const accessToken = `at_${crypto.randomUUID()}`
  session.accessTokens.push(accessToken)
  session.currentAccessToken = accessToken
  session.accessExpiresAt = accessExpiry()
  return toSessionDto(session, user)
}

export const revokeSessionByToken = (accessToken: string | null) => {
  const session = db.state.sessions.find(
    (candidate) => accessToken && candidate.accessTokens.includes(accessToken),
  )
  if (session) session.revoked = true
}

export const bearerToken = (request: Request): string | null => {
  const header = request.headers.get('Authorization') ?? ''
  return header.startsWith('Bearer ') ? header.slice('Bearer '.length) : null
}

/**
 * Autentica a requisição:
 * - sem token → 401 `UNAUTHENTICATED`;
 * - sessão revogada/expirada → 401 `SESSION_EXPIRED` (sem renovação);
 * - token de acesso vencido ou substituído → 401 `TOKEN_EXPIRED` (renovável);
 * - cenário `unauthorized` → 403.
 */
export const authenticate = (request: Request): { user: UserRecord; session: SessionRecord } => {
  const token = bearerToken(request)
  if (!token) throw new ApiError(401, 'UNAUTHENTICATED', 'Entre na sua conta para continuar')

  const session = db.state.sessions.find((candidate) => candidate.accessTokens.includes(token))
  const user = session ? db.findUser(session.userId) : undefined
  if (!session || !user || !isAlive(session)) throw sessionExpired()
  if (session.currentAccessToken !== token || new Date(session.accessExpiresAt).getTime() <= Date.now()) {
    throw new ApiError(401, 'TOKEN_EXPIRED', 'Sessão precisa ser renovada')
  }
  if (scenarios.is('unauthorized')) {
    throw new ApiError(403, 'FORBIDDEN', 'Você não tem permissão para acessar este recurso')
  }
  return { user, session }
}

/** Usuário dono de um token (para o socket): aceita qualquer token emitido em sessão viva. */
export const userIdForSocketToken = (token: string): string | null => {
  const session = db.state.sessions.find((candidate) => candidate.accessTokens.includes(token))
  return session && isAlive(session) ? session.userId : null
}

/** Expira todas as sessões abertas (gatilho de teste). */
export const expireAllSessions = () => {
  for (const session of db.state.sessions) session.revoked = true
}
