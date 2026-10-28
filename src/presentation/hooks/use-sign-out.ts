import { useRouter } from '@tanstack/react-router'

import { useLogout } from '@presentation/hooks/use-session'
import { userMessageFor } from '@presentation/lib/errors'
import { notify } from '@presentation/lib/notify'

/** "Sair" (menu da conta e menu lateral do perfil): encerra a sessão e volta ao Início. */
export const useSignOut = () => {
  const logout = useLogout()
  const router = useRouter()

  const signOut = () => {
    logout.mutate(undefined, {
      onSuccess: () => {
        void router.navigate({ to: '/' })
        notify.info('Você saiu da sua conta.')
      },
      onError: (error) => {
        const message = userMessageFor(error)
        if (message) notify.error(message)
      },
    })
  }

  return { signOut, isPending: logout.isPending }
}
