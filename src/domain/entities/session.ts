export type User = {
  readonly id: string
  readonly name: string
  readonly email: string
  readonly avatarUrl: string | null
}

export type Session = {
  readonly user: User
  readonly accessToken: string
  readonly refreshToken: string
  readonly accessExpiresAt: string
  readonly refreshExpiresAt: string
}

/** Token de acesso vencido ainda pode ser renovado enquanto o refresh for válido. */
export const isAccessExpired = (session: Session, now: Date) =>
  new Date(session.accessExpiresAt).getTime() <= now.getTime()

export const isSessionExpired = (session: Session, now: Date) =>
  new Date(session.refreshExpiresAt).getTime() <= now.getTime()
