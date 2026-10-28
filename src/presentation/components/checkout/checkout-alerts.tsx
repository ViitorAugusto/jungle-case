import { Link } from '@tanstack/react-router'
import type { ReactNode } from 'react'

import type { Order, QuoteChange } from '@application/dtos'

import { Button } from '@presentation/components/ui/button'
import type { CheckoutFailure } from '@presentation/hooks/use-checkout-flow'
import { cn } from '@presentation/lib/utils'

const describeChange = (change: QuoteChange): string => {
  switch (change.kind) {
    case 'price':
      return `O preço de ${change.nftName} (${change.editionName}) mudou de ${change.previousEth} ETH para ${change.currentEth} ETH.`
    case 'availability':
      return change.available === 0
        ? `${change.nftName} (${change.editionName}) esgotou.`
        : `A disponibilidade de ${change.nftName} (${change.editionName}) mudou: ${change.available === 1 ? 'resta 1' : `${change.available} disponíveis`}.`
    case 'line-removed':
      return `${change.nftName} (${change.editionName}) saiu do pedido.`
    case 'coupon':
      return change.currentCode
        ? `O cupom mudou para ${change.currentCode}.`
        : `O cupom ${change.previousCode ?? ''} deixou de valer.`
    case 'network-fee':
      return `A taxa de rede mudou de ${change.previousEth} ETH para ${change.currentEth} ETH.`
    case 'total':
      return `O total mudou de ${change.previousEth} ETH para ${change.currentEth} ETH.`
  }
}

type NoticeProps = {
  readonly role: 'alert' | 'status'
  readonly tone: 'danger' | 'warning' | 'info'
  readonly title: string
  readonly children?: ReactNode
  readonly action?: ReactNode
}

/** Aviso do pagamento: título em texto (não só cor), detalhes e ação de recuperação. */
function Notice({ role, tone, title, children, action }: NoticeProps) {
  return (
    <div
      role={role}
      className={cn(
        'flex flex-col gap-3 rounded-sm border bg-surface-dark px-4 py-3 text-body-sm text-foreground',
        tone === 'danger' && 'border-destructive',
        tone === 'warning' && 'border-amber/60',
        tone === 'info' && 'border-primary/60',
      )}
    >
      <p className="font-bold">{title}</p>
      {children}
      {action}
    </div>
  )
}

/** Diferenças entre a cotação revisada e a revalidada: exige nova confirmação (R26). */
export function QuoteChangesAlert({ changes }: { readonly changes: readonly QuoteChange[] }) {
  return (
    <Notice role="alert" tone="warning" title="Os valores do pedido mudaram. Confira e confirme de novo.">
      <ul className="flex list-disc flex-col gap-1 pl-5">
        {changes.map((change, index) => (
          <li key={`${change.kind}-${index}`}>{describeChange(change)}</li>
        ))}
      </ul>
    </Notice>
  )
}

/** O carrinho mudou em tempo real depois da revisão: a cotação não vale mais (R63). */
export function OutdatedQuoteAlert({
  onReviewAgain,
  busy,
}: {
  readonly onReviewAgain: () => void
  readonly busy: boolean
}) {
  return (
    <Notice
      role="alert"
      tone="warning"
      title="Os valores do carrinho mudaram desde a revisão."
      action={
        <Button size="sm" onClick={onReviewAgain} disabled={busy} className="self-start">
          Revisar novamente
        </Button>
      }
    >
      <p>Revise o pedido de novo para ver os valores atuais antes de confirmar.</p>
    </Notice>
  )
}

type FailureAlertProps = {
  readonly failure: CheckoutFailure
  readonly onRetry: () => void
  readonly onReviewAgain: () => void
  readonly busy: boolean
}

/** Falhas do envio com a ação de cada uma (premissa 20). */
export function CheckoutFailureAlert({ failure, onRetry, onReviewAgain, busy }: FailureAlertProps) {
  switch (failure.kind) {
    case 'sold-out':
      return (
        <Notice
          role="alert"
          tone="danger"
          title="Uma edição do seu pedido esgotou."
          action={
            <Button asChild size="sm" variant="outline" className="self-start">
              <Link to="/carrinho">Ajustar carrinho</Link>
            </Button>
          }
        >
          <p>Nada foi cobrado. Ajuste as quantidades no carrinho para continuar.</p>
        </Notice>
      )
    case 'quote-changed':
      return (
        <Notice
          role="alert"
          tone="warning"
          title="Os valores do pedido mudaram."
          action={
            <Button size="sm" onClick={onReviewAgain} disabled={busy} className="self-start">
              Revisar novamente
            </Button>
          }
        />
      )
    case 'retry':
      return (
        <Notice
          role="alert"
          tone="danger"
          title="Não recebemos a resposta do pedido."
          action={
            <Button size="sm" onClick={onRetry} disabled={busy} className="self-start">
              Tentar novamente
            </Button>
          }
        >
          <p>{failure.message} Tentar de novo recupera o mesmo pedido, sem cobrar duas vezes.</p>
        </Notice>
      )
    case 'generic':
      return <Notice role="alert" tone="danger" title={failure.message} />
  }
}

/** Pedido criado: pendente até a simulação decidir; recusado é final e preserva o carrinho. */
export function OrderStatusNotice({ order }: { readonly order: Order }) {
  if (order.status === 'rejected') {
    return (
      <Notice role="alert" tone="danger" title="Pagamento recusado.">
        <p>
          {order.rejectionReason ? `${order.rejectionReason} ` : null}
          Seu carrinho foi mantido. Revise o pedido para tentar de novo.
        </p>
      </Notice>
    )
  }
  return (
    <Notice role="status" tone="info" title="Pagamento pendente.">
      <p>
        Aguardando a confirmação da rede. Você será levado ao recibo assim que a transação for confirmada.
      </p>
    </Notice>
  )
}

/** Reenvio automático após timeout, com a mesma chave (premissa 25): nada a fazer pelo usuário. */
export function RecoveringOrderNotice() {
  return (
    <Notice role="status" tone="info" title="A confirmação demorou. Recuperando seu pedido…">
      <p>Estamos reenviando a mesma compra; ela não será cobrada duas vezes.</p>
    </Notice>
  )
}
