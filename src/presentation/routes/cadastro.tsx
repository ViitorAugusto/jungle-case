import { createFileRoute, redirect } from '@tanstack/react-router'

import { afterLoginPath, parseAuthSearch } from '@application/dtos'

import { AuthScreen } from '@presentation/screens/auth-screen'

export const Route = createFileRoute('/cadastro')({
  validateSearch: parseAuthSearch,
  // Já autenticado: segue direto para o destino.
  beforeLoad: ({ context, search }) => {
    if (context.sessionState.getSnapshot().session) {
      // eslint-disable-next-line @typescript-eslint/only-throw-error -- contrato do TanStack Router
      throw redirect({ href: afterLoginPath(search), replace: true })
    }
  },
  component: () => <AuthScreen mode="register" />,
})
