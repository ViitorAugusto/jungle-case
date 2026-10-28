import { createFileRoute } from '@tanstack/react-router'

import { CartScreen } from '@presentation/screens/cart-screen'

/** Pública: o visitante tem carrinho próprio, mesclado ao do usuário no login. */
export const Route = createFileRoute('/carrinho')({
  component: CartScreen,
})
