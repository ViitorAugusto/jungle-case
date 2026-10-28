import type { RequestHandler, WebSocketHandler } from 'msw'

import { accountHandlers } from '@mocks/handlers/account.handlers'
import { authHandlers } from '@mocks/handlers/auth.handlers'
import { cartHandlers } from '@mocks/handlers/cart.handlers'
import { catalogHandlers } from '@mocks/handlers/catalog.handlers'
import { controlHandlers } from '@mocks/handlers/control.handlers'
import { favoritesHandlers } from '@mocks/handlers/favorites.handlers'
import { ordersHandlers } from '@mocks/handlers/orders.handlers'
import { realtimeHandlers } from '@mocks/socket/realtime.handler'

/** API REST simulada por recurso + controle de cenários (`/__mock/*`). */
const restHandlers: RequestHandler[] = [
  ...controlHandlers,
  ...authHandlers,
  ...catalogHandlers,
  ...favoritesHandlers,
  ...cartHandlers,
  ...ordersHandlers,
  ...accountHandlers,
]

export const handlers: Array<RequestHandler | WebSocketHandler> = [...restHandlers, ...realtimeHandlers]
