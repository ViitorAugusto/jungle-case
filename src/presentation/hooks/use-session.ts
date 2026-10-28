import { useMutation } from '@tanstack/react-query'
import { useSyncExternalStore } from 'react'

import type { LoginInput, RegisterInput } from '@application/dtos'

import { container } from '@main/container'

const { sessionState } = container

/** Sessão corrente (reativa). `endedReason` diz se a última sessão saiu por logout ou expiração. */
export const useSession = () => {
  const snapshot = useSyncExternalStore(sessionState.subscribe, sessionState.getSnapshot)
  return {
    session: snapshot.session,
    user: snapshot.session?.user ?? null,
    isAuthenticated: snapshot.session !== null,
    endedReason: snapshot.endedReason,
  }
}

export const useCurrentUserId = (): string | null => useSession().user?.id ?? null

export const useLogin = () =>
  useMutation({ mutationFn: (input: LoginInput) => container.session.login.execute(input) })

export const useRegister = () =>
  useMutation({ mutationFn: (input: RegisterInput) => container.session.register.execute(input) })

/** Logout: encerra a sessão; cache privado e tempo real são limpos pelo runtime da sessão. */
export const useLogout = () => useMutation({ mutationFn: () => container.session.logout.execute() })
