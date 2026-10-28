import { createFileRoute } from '@tanstack/react-router'

import { WalletsScreen } from '@presentation/screens/wallets-screen'

export const Route = createFileRoute('/_autenticado/perfil/carteiras')({
  component: WalletsScreen,
})
