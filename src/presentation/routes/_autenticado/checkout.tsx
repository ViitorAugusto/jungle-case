import { createFileRoute } from '@tanstack/react-router'

import { CheckoutScreen } from '@presentation/screens/checkout-screen'

export const Route = createFileRoute('/_autenticado/checkout')({
  component: CheckoutScreen,
})
