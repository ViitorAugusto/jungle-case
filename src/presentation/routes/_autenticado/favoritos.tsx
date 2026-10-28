import { createFileRoute } from '@tanstack/react-router'

import { FavoritesScreen } from '@presentation/screens/favorites-screen'

export const Route = createFileRoute('/_autenticado/favoritos')({
  component: FavoritesScreen,
})
