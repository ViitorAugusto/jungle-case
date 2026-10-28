import { createFileRoute, Outlet } from '@tanstack/react-router'

import { requireAuth } from '@presentation/navigation/require-auth'

/** Layout das rotas privadas: sem sessão, vai ao login e volta para a rota pedida. */
export const Route = createFileRoute('/_autenticado')({
  beforeLoad: requireAuth,
  component: Outlet,
})
