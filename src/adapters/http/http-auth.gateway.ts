import type { AxiosInstance } from 'axios'

import type { Session, User } from '@domain/entities/session'

import type { AuthGateway } from '@application/ports/gateways/auth.gateway'

import {
  apiRoutes,
  type LoginRequest,
  type RefreshRequest,
  type RegisterRequest,
  type SessionDto,
  type UserDto,
} from '@adapters/http/contracts'
import { toSession } from '@adapters/mappers/api.mapper'

export class HttpAuthGateway implements AuthGateway {
  private readonly http: AxiosInstance

  constructor(http: AxiosInstance) {
    this.http = http
  }

  async login(email: string, password: string): Promise<Session> {
    const body: LoginRequest = { email, password }
    const { data } = await this.http.post<SessionDto>(apiRoutes.login, body, { skipAuth: true })
    return toSession(data)
  }

  async register(input: RegisterRequest): Promise<Session> {
    const { data } = await this.http.post<SessionDto>(apiRoutes.register, input, { skipAuth: true })
    return toSession(data)
  }

  async refresh(refreshToken: string): Promise<Session> {
    const body: RefreshRequest = { refreshToken }
    const { data } = await this.http.post<SessionDto>(apiRoutes.refresh, body, { skipAuth: true })
    return toSession(data)
  }

  async logout(): Promise<void> {
    await this.http.post(apiRoutes.logout)
  }

  async me(): Promise<User> {
    const { data } = await this.http.get<UserDto>(apiRoutes.me)
    return { ...data }
  }
}
