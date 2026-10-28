import { useIsMutating, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  cartBadgeCount,
  diffCart,
  type AddCartItemInput,
  type Cart,
  type CartChange,
  type UpdateCartItemInput,
} from '@application/dtos'

import { container } from '@main/container'
import { queryKeys } from '@main/query/query-keys'
import { useCurrentUserId } from '@presentation/hooks/use-session'

const { cart } = container

/**
 * Carrinho do visitante ou do usuário (a chave muda com a sessão). Persistido
 * no servidor simulado, então sobrevive a refresh; o resumo vem da API. Ao
 * recarregar por evento/reconexão, diferenças de preço e estoque viram avisos
 * em `useCartChanges`.
 */
const useCartQueryOptions = () => {
  const queryClient = useQueryClient()
  const userId = useCurrentUserId()
  const key = queryKeys.cart(userId)
  return {
    queryKey: key,
    queryFn: async ({ signal }: { signal: AbortSignal }) => {
      const previous = queryClient.getQueryData<Cart>(key)
      const next = await cart.get.execute({ signal })
      const changes = previous ? diffCart(previous, next) : []
      if (changes.length > 0) queryClient.setQueryData(queryKeys.cartChanges(userId), changes)
      return next
    },
  }
}

export const useCart = () => useQuery(useCartQueryOptions())

/** Avisos de mudança no carrinho aberto (preço, estoque, item removido). `dismiss` limpa. */
export const useCartChanges = () => {
  const queryClient = useQueryClient()
  const key = queryKeys.cartChanges(useCurrentUserId())
  const { data } = useQuery<readonly CartChange[]>({
    queryKey: key,
    queryFn: () => [],
    staleTime: Infinity,
    initialData: [],
  })
  return { changes: data, dismiss: () => queryClient.setQueryData<readonly CartChange[]>(key, []) }
}

const CART_MUTATION_KEY = ['cart-mutation'] as const

/** Mutations do carrinho gravam a resposta da API direto no cache (fonte da verdade do resumo). */
const useCartMutation = <TInput>(mutationFn: (input: TInput) => Promise<Cart>) => {
  const queryClient = useQueryClient()
  const key = queryKeys.cart(useCurrentUserId())
  return useMutation({
    mutationKey: CART_MUTATION_KEY,
    mutationFn,
    onSuccess: (next) => queryClient.setQueryData(key, next),
    onError: () => queryClient.invalidateQueries({ queryKey: key, exact: true }),
  })
}

export const useAddToCart = () => useCartMutation((input: AddCartItemInput) => cart.addItem.execute(input))

export const useUpdateCartItem = () =>
  useCartMutation((input: UpdateCartItemInput) => cart.updateItem.execute(input))

export const useRemoveCartItem = () => useCartMutation((lineId: string) => cart.removeItem.execute(lineId))

/** Erros: `reason` `COUPON_INVALID` ou `COUPON_EXPIRED` (422). */
export const useApplyCoupon = () => useCartMutation((code: string) => cart.applyCoupon.execute(code))

export const useRemoveCoupon = () => useCartMutation(() => cart.removeCoupon.execute())

/** Itens distintos no carrinho (badge do cabeçalho), não unidades. */
export const useCartCount = (): number => {
  const { data = 0 } = useQuery({
    ...useCartQueryOptions(),
    select: cartBadgeCount,
  })
  return data
}

/**
 * Resumo sendo recotado pela API (alteração do usuário em andamento ou
 * recarga por evento/reconexão): a interface mostra skeleton nos valores.
 */
export const useIsCartRepricing = (): boolean => {
  const mutating = useIsMutating({ mutationKey: CART_MUTATION_KEY }) > 0
  const { isFetching, isPending } = useCart()
  return mutating || (isFetching && !isPending)
}
