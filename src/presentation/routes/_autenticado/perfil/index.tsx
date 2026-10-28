import { createFileRoute } from '@tanstack/react-router'

import { ProfileScreen } from '@presentation/screens/profile-screen'

export const Route = createFileRoute('/_autenticado/perfil/')({
  component: ProfileScreen,
})
