import type { Session } from '@domain/entities/session'

import type {
  CheckoutAttempt,
  CheckoutAttemptStorage,
} from '@application/ports/services/checkout-attempt-storage'
import type { CheckoutDraft, CheckoutDraftStorage } from '@application/ports/services/checkout-draft-storage'
import type { GuestCartStorage } from '@application/ports/services/guest-cart-storage'
import type { IdGenerator } from '@application/ports/services/id-generator'
import type { SessionStorage } from '@application/ports/services/session-storage'

const KEYS = {
  session: 'nft-market:session',
  guestCart: 'nft-market:guest-cart',
  checkoutDraft: 'nft-market:checkout-draft',
  checkoutAttempt: (userId: string) => `nft-market:checkout:${userId}`,
} as const

/** Acesso tolerante ao `localStorage` (modo privado, cota cheia ou bloqueio não quebram a app). */
const storage = {
  read(key: string): unknown {
    try {
      const raw = window.localStorage.getItem(key)
      return raw ? (JSON.parse(raw) as unknown) : null
    } catch {
      return null
    }
  },
  write(key: string, value: unknown): void {
    try {
      window.localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // Sem persistência o fluxo segue em memória.
    }
  },
  remove(key: string): void {
    try {
      window.localStorage.removeItem(key)
    } catch {
      // Idem.
    }
  },
}

const isSession = (value: unknown): value is Session => {
  const candidate = value as Partial<Session> | null
  return (
    typeof candidate?.accessToken === 'string' &&
    typeof candidate.refreshToken === 'string' &&
    typeof candidate.refreshExpiresAt === 'string' &&
    typeof candidate.user?.id === 'string'
  )
}

export class LocalSessionStorage implements SessionStorage {
  load(): Session | null {
    const value = storage.read(KEYS.session)
    return isSession(value) ? value : null
  }

  save(session: Session): void {
    storage.write(KEYS.session, session)
  }

  clear(): void {
    storage.remove(KEYS.session)
  }
}

export class LocalGuestCartStorage implements GuestCartStorage {
  private readonly ids: IdGenerator

  constructor(ids: IdGenerator) {
    this.ids = ids
  }

  load(): string | null {
    const value = storage.read(KEYS.guestCart)
    return typeof value === 'string' ? value : null
  }

  getOrCreate(): string {
    const existing = this.load()
    if (existing) return existing
    const created = this.ids.uuid()
    storage.write(KEYS.guestCart, created)
    return created
  }

  clear(): void {
    storage.remove(KEYS.guestCart)
  }
}

/** Tentativa de compra por usuário: sobrevive a refresh para recuperar o pedido sem duplicar. */
export class LocalCheckoutAttemptStorage implements CheckoutAttemptStorage {
  load(userId: string): CheckoutAttempt | null {
    const value = storage.read(KEYS.checkoutAttempt(userId)) as CheckoutAttempt | null
    return value && typeof value.idempotencyKey === 'string' ? value : null
  }

  save(userId: string, attempt: CheckoutAttempt): void {
    storage.write(KEYS.checkoutAttempt(userId), attempt)
  }

  clear(userId: string): void {
    storage.remove(KEYS.checkoutAttempt(userId))
  }
}

/**
 * Rascunho do pagamento no `sessionStorage`: sobrevive a refresh e à ida ao
 * login quando a sessão expira, e some ao fechar a aba.
 */
export class SessionCheckoutDraftStorage implements CheckoutDraftStorage {
  load(): CheckoutDraft | null {
    try {
      const raw = window.sessionStorage.getItem(KEYS.checkoutDraft)
      const value = raw ? (JSON.parse(raw) as Partial<CheckoutDraft>) : null
      if (!value) return null
      // Rascunho de formato anterior ou adulterado: campos ausentes voltam vazios.
      const text = (candidate: unknown, fallback: string) =>
        typeof candidate === 'string' ? candidate : fallback
      const collector: Partial<Record<string, unknown>> = value.collector ?? {}
      const payment: Partial<Record<string, unknown>> = value.payment ?? {}
      return {
        collector: {
          displayName: text(collector.displayName, ''),
          username: text(collector.username, ''),
          profileName: text(collector.profileName, ''),
          email: text(collector.email, ''),
          ensName: text(collector.ensName, ''),
          referralCode: text(collector.referralCode, ''),
          note: text(collector.note, ''),
        },
        payment: {
          network: text(payment.network, ''),
          address: text(payment.address, ''),
          secondaryAddressOrEns: text(payment.secondaryAddressOrEns, ''),
          provider: text(payment.provider, ''),
          walletId: typeof payment.walletId === 'string' ? payment.walletId : null,
        },
        useOtherWallet: value.useOtherWallet === true,
      }
    } catch {
      return null
    }
  }

  save(draft: CheckoutDraft): void {
    try {
      window.sessionStorage.setItem(KEYS.checkoutDraft, JSON.stringify(draft))
    } catch {
      // Sem armazenamento o rascunho vale só enquanto a tela estiver aberta.
    }
  }

  clear(): void {
    try {
      window.sessionStorage.removeItem(KEYS.checkoutDraft)
    } catch {
      // Idem.
    }
  }
}
