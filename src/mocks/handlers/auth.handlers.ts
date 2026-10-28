import type { LoginRequest, RefreshRequest, RegisterRequest } from '@adapters/http/contracts'

import { db } from '@mocks/db/database'
import { ApiError, commitEmpty, commitJson, readJson, route, validationError } from '@mocks/http/respond'
import { scenarios } from '@mocks/scenarios/scenarios'
import {
  authenticate,
  bearerToken,
  hashPassword,
  openSession,
  refreshSession,
  revokeSessionByToken,
  toUserDto,
  verifyPassword,
} from '@mocks/services/auth'
import { validateRegistrationFields } from '@mocks/services/validation'

const emailInUse = () =>
  new ApiError(409, 'EMAIL_IN_USE', 'Este e-mail já está cadastrado', {
    email: ['Este e-mail já está cadastrado'],
  })

/** Nome de usuário inicial a partir do e-mail, com sufixo numérico se já existir. */
const uniqueUsername = (email: string) => {
  const local = (email.split('@')[0] ?? '').toLowerCase().replace(/[^a-z0-9_]/g, '_')
  const base = (local.length >= 3 ? local : `${local}___`.slice(0, 3)).slice(0, 16)
  const taken = (candidate: string) => db.state.users.some((user) => user.username === candidate)
  let candidate = base
  for (let suffix = 2; taken(candidate); suffix += 1) candidate = `${base}${suffix}`
  return candidate
}

export const authHandlers = [
  route('post', '/auth/register', async ({ request }) => {
    const body = await readJson<RegisterRequest>(request)
    const name = (body.name ?? '').trim()
    const email = (body.email ?? '').trim().toLowerCase()
    const password = body.password ?? ''

    const fieldErrors = validateRegistrationFields({ name, email, password })
    if (scenarios.is('validation-error')) throw validationError({ email: ['E-mail recusado pelo servidor'] })
    if (Object.keys(fieldErrors).length > 0) throw validationError(fieldErrors)
    if (scenarios.is('register-conflict') || db.state.users.some((user) => user.email === email))
      throw emailInUse()

    const salt = crypto.randomUUID()
    const user = {
      id: `usr_${crypto.randomUUID().slice(0, 8)}`,
      name,
      username: uniqueUsername(email),
      email,
      ensName: '',
      walletNickname: '',
      avatarUrl: null,
      salt,
      passwordHash: await hashPassword(salt, password),
      updatedAt: new Date().toISOString(),
    }
    db.state.users.push(user)
    return commitJson(openSession(user), { status: 201 })
  }),

  route('post', '/auth/login', async ({ request }) => {
    const body = await readJson<LoginRequest>(request)
    const email = (body.email ?? '').trim().toLowerCase()
    const user = db.state.users.find((candidate) => candidate.email === email)
    if (!user || !(await verifyPassword(user, body.password ?? ''))) {
      throw new ApiError(401, 'INVALID_CREDENTIALS', 'E-mail ou senha incorretos')
    }
    return commitJson(openSession(user))
  }),

  route('post', '/auth/refresh', async ({ request }) => {
    const body = await readJson<RefreshRequest>(request)
    return commitJson(refreshSession(body.refreshToken ?? ''))
  }),

  route('post', '/auth/logout', ({ request }) => {
    revokeSessionByToken(bearerToken(request))
    return commitEmpty()
  }),

  route('get', '/auth/me', ({ request }) => commitJson(toUserDto(authenticate(request).user))),
]
