import type { Session } from '@domain/entities/session'

/** Persistência da sessão para sobreviver a refresh. */
export interface SessionStorage {
  load(): Session | null
  save(session: Session): void
  clear(): void
}
