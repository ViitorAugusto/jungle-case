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
  type Wallet,
} from '@application/dtos'

import { useWallets } from '@presentation/hooks/use-account'
import {
  useCheckoutDraft,
  useCreateQuote,
  useInitialCheckoutForm,
  useIsQuoteOutdated,
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

const NOT_CONNECTED = 'Conecte a carteira pelo provedor escolhido'

/** A carteira cadastrada escolhida precisa estar conectada pelo mesmo provedor (regra da API). */
const connectionErrors = (form: CheckoutDraft, wallets: readonly Wallet[] | undefined): FormErrors => {
  const { walletId, provider } = form.payment
  if (form.useOtherWallet || !walletId || !provider) return {}
  const wallet = wallets?.find((candidate) => candidate.slot === walletId)
  return wallet?.connected && wallet.provider === provider ? {} : { 'payment.provider': [NOT_CONNECTED] }
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
 * Fluxo do Pagamento (premissa 23): editar → "Revisar pedido" (cotação) →
 * revisão travada → "Confirmar compra" (revalida; se algo mudou, mostra as
 * diferenças e pede nova confirmação) → pedido pendente até a simulação
 * decidir. Confirmado leva ao recibo; recusado volta à edição com o carrinho
 * intacto.
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
  const outdated = useIsQuoteOutdated(quote)

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

  const requestQuote = () => {
    setFailure(null)
    setChanges([])
    createQuote.mutate(undefined, { onSuccess: setQuote, onError: fail })
  }

  /** "Revisar pedido": valida o formulário e a conexão antes de cotar. */
  const review = () => {
    if (!form) return
    const found = { ...validateCheckoutForm(form), ...connectionErrors(form, wallets.data) }
    setErrors(found)
    if (Object.keys(found).length > 0) {
      focusFirstInvalid()
      return
    }
    requestQuote()
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

  /** "Confirmar compra": revalida; diferença trava o envio até nova confirmação. */
  const confirm = () => {
    if (!quote || placeOrder.isPending || revalidate.isPending) return
    setFailure(null)
    if (changes.length > 0) {
      // O usuário já viu as diferenças desta cotação: confirmar agora é a nova confirmação.
      setChanges([])
      submit(quote)
      return
    }
    revalidate.mutate(quote, {
      onSuccess: (result) => {
        setQuote(result.quote)
        if (result.requiresConfirmation) setChanges(result.changes)
        else submit(result.quote)
      },
      onError: fail,
    })
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
    outdated,
    failure,
    recovering,
    order: current,
    review,
    confirm,
    retry,
    edit,
    startOver,
    reviewAgain: requestQuote,
    isQuoting: createQuote.isPending,
    isSubmitting: revalidate.isPending || placeOrder.isPending,
  }
}
