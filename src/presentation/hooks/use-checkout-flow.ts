import { useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'

import {
  hasReason,
  isApplicationError,
  validateCheckoutForm,
  type CheckoutDraft,
  type Order,
  type Quote,
  type QuoteChange,
  isWalletProvider,
  type Wallet,
  type WalletProvider,
  type WalletSlot,
} from '@application/dtos'

import { useSetWalletConnection, useWallets } from '@presentation/hooks/use-account'
import {
  useCheckoutDraft,
  useCreateQuote,
  useInitialCheckoutForm,
  useOrder,
  usePendingCheckout,
  usePlaceOrder,
  useRevalidateQuote,
} from '@presentation/hooks/use-checkout'

export type FormErrors = Readonly<Record<string, readonly string[]>>

/** Falha que bloqueia o envio, com o texto do alerta e a ação de recuperação (premissa 20). */
export type CheckoutFailure =
  | { readonly kind: 'sold-out' }
  | { readonly kind: 'quote-changed' }
  | { readonly kind: 'retry'; readonly message: string }
  | { readonly kind: 'generic'; readonly message: string }

/**
 * Carteira cadastrada que precisa ser conectada (simulação, R25) pelo provedor
 * escolhido antes de cotar; `null` quando já está conectada ou não se aplica
 * ("Usar outra carteira?" não tem conexão).
 */
const pendingConnection = (
  form: CheckoutDraft,
  wallets: readonly Wallet[] | undefined,
): { slot: Wallet['slot']; provider: NonNullable<Wallet['provider']> } | null => {
  const { walletId, provider } = form.payment
  if (form.useOtherWallet || !walletId || !isWalletProvider(provider)) return null
  const wallet = wallets?.find((candidate) => candidate.slot === walletId)
  if (!wallet || (wallet.connected && wallet.provider === provider)) return null
  return { slot: wallet.slot, provider }
}

/** Falha sem resposta: o pedido pode ter sido criado; reenviar com a mesma chave o recupera. */
const isUnanswered = (error: unknown) =>
  isApplicationError(error) &&
  (error.code === 'TIMEOUT' || error.code === 'OFFLINE' || error.code === 'TRANSIENT')

const failureOf = (error: unknown): CheckoutFailure => {
  if (isApplicationError(error)) {
    if (hasReason(error, 'EDITION_SOLD_OUT') || hasReason(error, 'QUANTITY_EXCEEDS_AVAILABILITY')) {
      return { kind: 'sold-out' }
    }
    if (hasReason(error, 'QUOTE_OUTDATED') || hasReason(error, 'QUOTE_EXPIRED'))
      return { kind: 'quote-changed' }
    if (isUnanswered(error)) return { kind: 'retry', message: error.message }
    return { kind: 'generic', message: error.message }
  }
  return { kind: 'generic', message: 'Algo deu errado. Tente novamente.' }
}

/** Foca o primeiro campo inválido depois que os erros aparecem na tela. */
const focusFirstInvalid = () => {
  requestAnimationFrame(() => {
    document.querySelector<HTMLElement>('[data-checkout-form] [aria-invalid="true"]')?.focus()
  })
}

/**
 * Fluxo do Pagamento (premissa 23): um único "Confirmar compra" valida o
 * formulário, conecta a carteira escolhida (simulação, R25), cota e revalida
 * preço e disponibilidade. Sem diferença, envia; com diferença, mostra as
 * mudanças e pede nova confirmação. O pedido fica pendente até a simulação
 * decidir: confirmado leva ao recibo; recusado volta à edição com o carrinho intacto.
 */
export const useCheckoutFlow = () => {
  const navigate = useNavigate()
  const initial = useInitialCheckoutForm()
  const draftStore = useCheckoutDraft()
  const wallets = useWallets()
  const pending = usePendingCheckout()
  const createQuote = useCreateQuote()
  const revalidate = useRevalidateQuote()
  const placeOrder = usePlaceOrder()
  const connection = useSetWalletConnection()

  const [edited, setEdited] = useState<CheckoutDraft | null>(null)
  const [errors, setErrors] = useState<FormErrors>({})
  const [quote, setQuote] = useState<Quote | null>(null)
  const [changes, setChanges] = useState<readonly QuoteChange[]>([])
  const [failure, setFailure] = useState<CheckoutFailure | null>(null)
  const [placedOrderId, setPlacedOrderId] = useState<string | null>(null)
  /** Reenvio automático em andamento após timeout (premissa 25). */
  const [recovering, setRecovering] = useState(false)

  const form = edited ?? initial
  // Tentativa retomada (refresh, timeout): recusa anterior já foi encerrada e não volta à tela.
  const resumed = pending.data && pending.data.status !== 'rejected' ? pending.data : null
  const orderId = placedOrderId ?? resumed?.id ?? null
  const order = useOrder(orderId)
  const current: Order | null = order.data ?? resumed
  const busy =
    createQuote.isPending ||
    revalidate.isPending ||
    placeOrder.isPending ||
    connection.isPending ||
    current?.status === 'pending'

  useEffect(() => {
    if (current?.status === 'confirmed') {
      void navigate({ to: '/pedidos/$orderId', params: { orderId: current.id }, replace: true })
    }
  }, [current?.id, current?.status, navigate])

  const update = (next: CheckoutDraft, touched: readonly string[]) => {
    setEdited(next)
    draftStore.save(next)
    if (touched.some((field) => errors[field])) {
      setErrors((previous) =>
        Object.fromEntries(Object.entries(previous).filter(([key]) => !touched.includes(key))),
      )
    }
  }

  const fail = (error: unknown) => {
    if (
      isApplicationError(error) &&
      error.code === 'VALIDATION' &&
      Object.keys(error.fieldErrors).length > 0
    ) {
      setErrors(error.fieldErrors)
      setQuote(null)
      focusFirstInvalid()
      return
    }
    setFailure(failureOf(error))
  }

  /** Conexão simulada da carteira cadastrada pelo provedor (R25). */
  const connect = (slot: WalletSlot, provider: WalletProvider) => {
    connection.reset()
    return connection.mutateAsync({ slot, connected: true, provider })
  }

  const disconnect = (slot: WalletSlot) => {
    connection.reset()
    connection.mutate({ slot, connected: false })
  }

  /** Cota e revalida em seguida: diferença abre a confirmação das mudanças; senão envia. */
  const quoteAndSubmit = () => {
    setFailure(null)
    setChanges([])
    createQuote.mutate(undefined, {
      onSuccess: (created) => {
        revalidate.mutate(created, {
          onSuccess: (result) => {
            setQuote(result.quote)
            if (result.requiresConfirmation) setChanges(result.changes)
            else submit(result.quote)
          },
          onError: fail,
        })
      },
      onError: fail,
    })
  }

  /** "Confirmar compra": valida, conecta se preciso e segue para cotação e envio. */
  const purchase = () => {
    if (!form || busy) return
    if (current?.status === 'rejected') startOver()
    const found = validateCheckoutForm(form)
    setErrors(found)
    if (Object.keys(found).length > 0) {
      focusFirstInvalid()
      return
    }
    const needed = pendingConnection(form, wallets.data)
    if (!needed) {
      quoteAndSubmit()
      return
    }
    connect(needed.slot, needed.provider).then(quoteAndSubmit, () => {
      // A recusa aparece no próprio bloco "Carteira e rede" (`connection.error`).
    })
  }

  /**
   * Envia o pedido. Sem resposta (timeout, queda), reenvia sozinho uma vez com
   * a mesma chave de idempotência e anuncia a recuperação (premissa 25); só se
   * o reenvio também falhar aparece "Tentar novamente".
   */
  const submit = (reviewed: Quote, autoRecover = true) => {
    if (!form) return
    placeOrder.mutate(
      { collector: form.collector, payment: form.payment, quoteId: reviewed.id },
      {
        onSuccess: (placed) => {
          // Após um reenvio, o anúncio fica até o pedido sair da tela (pendente → recibo).
          setPlacedOrderId(placed.id)
          draftStore.clear()
        },
        onError: (error) => {
          if (autoRecover && isUnanswered(error)) {
            setRecovering(true)
            submit(reviewed, false)
            return
          }
          setRecovering(false)
          fail(error)
        },
      },
    )
  }

  /** Confirma de novo depois de ver as mudanças: envia com a cotação vigente. */
  const confirmChanges = () => {
    if (!quote || placeOrder.isPending) return
    setChanges([])
    submit(quote)
  }

  /** Mesma chamada (mesma chave de idempotência) depois de timeout ou queda. */
  const retry = () => {
    setFailure(null)
    if (quote) submit(quote)
  }

  const edit = () => {
    setQuote(null)
    setChanges([])
    setFailure(null)
  }

  /** Recusa é final: nova tentativa parte da edição, com o carrinho intacto. */
  const startOver = () => {
    setPlacedOrderId(null)
    setRecovering(false)
    edit()
  }

  return {
    form,
    errors,
    update,
    quote,
    changes,
    failure,
    recovering,
    order: current,
    connection,
    connect,
    disconnect,
    purchase,
    confirmChanges,
    retry,
    edit,
    startOver,
    reviewAgain: purchase,
    busy,
  }
}
