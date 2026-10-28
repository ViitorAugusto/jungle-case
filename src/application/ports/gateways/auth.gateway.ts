import type { Session, User } from '@domain/entities/session'

export interface AuthGateway {
  login(email: string, password: string): Promise<Session>
  register(input: { name: string; email: string; password: string }): Promise<Session>
  refresh(refreshToken: string): Promise<Session>
  logout(): Promise<void>
  me(): Promise<User>
}
