import { createFileRoute } from '@tanstack/react-router'

import { ReceiptScreen } from '@presentation/screens/receipt-screen'

/** Recibo do pedido: acesso direto pela URL, inclusive após refresh (R45). */
export const Route = createFileRoute('/_autenticado/pedidos/$orderId')({
  component: ReceiptScreen,
})
