import type { Session } from '@domain/entities/session'

export type SessionEndReason = 'logout' | 'expired'

export type SessionSnapshot = {
  readonly session: Session | null
  /** Por que a última sessão terminou (para avisar o usuário); `null` enquanto ativa. */
  readonly endedReason: SessionEndReason | null
}

type Listener = (next: SessionSnapshot, previous: SessionSnapshot) => void

/**
 * Fonte única da sessão corrente em memória. Casos de uso alteram; interface,
 * cliente HTTP e tempo real observam. Notificação síncrona: quem limpa cache e
 * subscriptions roda antes de qualquer render com o novo usuário.
 */
export class SessionState {
  private snapshot: SessionSnapshot = { session: null, endedReason: null }
  private readonly listeners = new Set<Listener>()

  getSnapshot = (): SessionSnapshot => this.snapshot

  subscribe = (listener: Listener): (() => void) => {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  get current(): Session | null {
    return this.snapshot.session
  }

  /** Nova sessão (login, cadastro, restauração) ou tokens renovados do mesmo usuário. */
  set(session: Session): void {
    this.emit({ session, endedReason: null })
  }

  end(reason: SessionEndReason): void {
    if (!this.snapshot.session) return
    this.emit({ session: null, endedReason: reason })
  }

  private emit(next: SessionSnapshot): void {
    const previous = this.snapshot
    this.snapshot = next
    for (const listener of this.listeners) listener(next, previous)
  }
}
