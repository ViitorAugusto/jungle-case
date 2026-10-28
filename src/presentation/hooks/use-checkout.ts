import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useMemo, useState } from 'react'

import {
  isConfirmed,
  isQuoteOutdated,
  prefillCheckoutForm,
  reconcileOrder,
  type CheckoutDraft,
  type CheckoutFormValues,
  type Order,
  type PlaceOrderInput,
  type Quote,
} from '@application/dtos'

import { container } from '@main/container'
import { queryKeys } from '@main/query/query-keys'
import { useProfile, useWallets } from '@presentation/hooks/use-account'
import { useCart } from '@presentation/hooks/use-cart'
import { useCurrentUserId } from '@presentation/hooks/use-session'

const { checkout } = container

const PENDING_ORDER_POLL_MS = 4_000

/** Gera a cotação (preços, cupom e taxas congelados) para a revisão do pagamento. */
export const useCreateQuote = () => useMutation({ mutationFn: () => checkout.createQuote.execute() })

/**
 * Revalida antes de enviar. Se `requiresConfirmation`, mostre `changes` e
 * peça nova confirmação com a `quote` devolvida; senão, envie com ela.
 */
export const useRevalidateQuote = () =>
  useMutation({ mutationFn: (reviewed: Quote) => checkout.revalidateQuote.execute(reviewed) })

/** Cotação desatualizada em relação ao carrinho atual (ex.: preço mudou via tempo real). */
export const useIsQuoteOutdated = (quote: Quote | null | undefined): boolean => {
  const { data: cart } = useCart()
  return Boolean(quote && cart && isQuoteOutdated(quote, cart))
}

/**
 * Envia o pedido. Clique repetido, timeout e refresh reaproveitam a mesma
 * chave de idempotência: nunca há pedido duplicado. Use `isPending` para
 * bloquear o botão; em `TIMEOUT`/`OFFLINE`, ofereça "tentar novamente" (mesma
 * chamada, mesma chave).
 */
export const usePlaceOrder = () => {
  const queryClient = useQueryClient()
  const userId = useCurrentUserId()
  return useMutation({
    mutationFn: (input: PlaceOrderInput) => checkout.placeOrder.execute(input),
    onSuccess: (order) => {
      // Pedido criado: o rascunho do formulário deixa de ser necessário.
      checkout.draft.clear()
      if (!userId) return
      const key = queryKeys.order(userId, order.id)
      queryClient.setQueryData<Order>(key, (current) => reconcileOrder(current, order))
    },
  })
}

/**
 * Estado do pedido: atualizado por `order.updated` e, enquanto pendente, por
 * consulta periódica como rede de segurança. Confirmado e recusado são finais.
 */
export const useOrder = (orderId: string | null | undefined) => {
  const queryClient = useQueryClient()
  const userId = useCurrentUserId()
  const key = userId && orderId ? queryKeys.order(userId, orderId) : queryKeys.inactive('order')
  return useQuery({
    queryKey: key,
    queryFn: async ({ signal }) => {
      const fetched = await checkout.getOrder.execute(orderId ?? '', { signal })
      return reconcileOrder(queryClient.getQueryData<Order>(key), fetched)
    },
    enabled: Boolean(userId && orderId),
    refetchInterval: (query) => (query.state.data?.status === 'pending' ? PENDING_ORDER_POLL_MS : false),
  })
}

/** Recibo (snapshot). Só consulta quando o pedido está confirmado pela simulação. */
export const useReceipt = (order: Order | null | undefined) => {
  const userId = useCurrentUserId()
  const orderId = order?.id ?? ''
  return useQuery({
    queryKey: userId && orderId ? queryKeys.receipt(userId, orderId) : queryKeys.inactive('receipt'),
    queryFn: ({ signal }) => checkout.getReceipt.execute(orderId, { signal }),
    enabled: Boolean(userId && order && isConfirmed(order)),
    staleTime: Infinity,
  })
}

/**
 * Compra em andamento recuperada após refresh, queda ou timeout (sem criar
 * pedido novo). `data === null` quando não há nada a retomar.
 */
export const usePendingCheckout = () => {
  const userId = useCurrentUserId()
  return useQuery({
    queryKey: userId ? queryKeys.pendingCheckout(userId) : queryKeys.inactive('pending-checkout'),
    queryFn: () => checkout.resume.execute(),
    enabled: userId !== null,
    staleTime: 0,
  })
}

/**
 * Rascunho do formulário de pagamento (mesmo formato do pedido, mais `useOtherWallet`).
 * Cada `save` grava na aba, então os dados voltam depois de refresh ou de um
 * login por sessão expirada. É limpo quando o pedido é criado.
 */
export const useCheckoutDraft = () => {
  const [draft, setDraft] = useState<CheckoutDraft | null>(() => checkout.draft.load())
  const save = useCallback((next: CheckoutDraft) => {
    checkout.draft.save(next)
    setDraft(next)
  }, [])
  const clear = useCallback(() => {
    checkout.draft.clear()
    setDraft(null)
  }, [])
  return { draft, save, clear }
}

/**
 * Valores sugeridos ("preenche uma vez"): dados do colecionador, rede,
 * endereço e tipo da carteira principal; nome de usuário do perfil (e nome,
 * e-mail e ENS do perfil quando não há carteira principal).
 */
export const useCheckoutPrefill = () => {
  const profile = useProfile()
  const wallets = useWallets()
  const values = useMemo<CheckoutFormValues | undefined>(() => {
    if (!profile.data || !wallets.data) return undefined
    const primary = wallets.data.find((wallet) => wallet.slot === 'primary') ?? null
    return prefillCheckoutForm(profile.data, primary)
  }, [profile.data, wallets.data])
  return { values, isLoading: profile.isPending || wallets.isPending }
}

/**
 * Ponto de partida do formulário: o rascunho salvo, se houver; senão o
 * pré-preenchimento. `undefined` enquanto perfil e carteiras carregam.
 */
export const useInitialCheckoutForm = (): CheckoutDraft | undefined => {
  const { draft } = useCheckoutDraft()
  const { values } = useCheckoutPrefill()
  if (draft) return draft
  return values ? { ...values, useOtherWallet: false } : undefined
}
