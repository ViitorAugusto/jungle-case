import { getRouteApi, Link, useNavigate } from '@tanstack/react-router'
import { ExternalLinkIcon, XIcon } from 'lucide-react'
import type { ReactNode } from 'react'

import { receiptWalletLabel, type Receipt } from '@application/dtos'

import { PurchaseLine } from '@presentation/components/checkout/purchase-line'
import { ThankYouIllustration } from '@presentation/components/checkout/thank-you-illustration'
import { StatePanel } from '@presentation/components/feedback/state-panel'
import { explorerLabels, networkLabels } from '@presentation/components/nft/network-labels'
import { Button } from '@presentation/components/ui/button'
import { EthValue } from '@presentation/components/ui/eth-value'
import { Skeleton } from '@presentation/components/ui/skeleton'
import { useOrder, useReceipt } from '@presentation/hooks/use-checkout'
import { isNotFound } from '@presentation/lib/errors'
import { formatReceiptDate, shortenHash } from '@presentation/lib/format'

const routeApi = getRouteApi('/_autenticado/pedidos/$orderId')

const isZero = (amount: string) => /^0(\.0*)?$/.test(amount)

/** Card central do Figma (578 px) com a borda inferior laranja grossa; largura total no mobile. */
function ReceiptCard({ children, busy }: { readonly children: ReactNode; readonly busy?: boolean }) {
  const navigate = useNavigate()
  return (
    <div className="mx-auto w-full max-w-receipt px-4 md:px-0">
      <article
        aria-busy={busy || undefined}
        className="relative flex flex-col items-center gap-6 rounded-lg border-b-10 border-primary bg-surface-card px-6 pt-10 pb-8 md:px-10"
      >
        <Button
          variant="ghost"
          size="icon"
          aria-label="Fechar"
          onClick={() => {
            void navigate({ to: '/' })
          }}
          className="absolute top-3 right-3"
        >
          <XIcon aria-hidden="true" />
        </Button>
        {children}
      </article>
    </div>
  )
}

function TransactionFact({ label, children }: { readonly label: string; readonly children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1 px-3 py-3 text-center md:py-0 [&:not(:first-child)]:border-border md:[&:not(:first-child)]:border-l max-md:[&:nth-child(n+3)]:border-t">
      <dt className="text-small text-text-secondary">{label}</dt>
      <dd className="text-body-sm font-bold break-words text-foreground">{children}</dd>
    </div>
  )
}

function ConfirmedReceipt({ receipt }: { readonly receipt: Receipt }) {
  const { network } = receipt.payment
  const { hash, explorerUrl } = receipt.transaction

  return (
    <ReceiptCard>
      <ThankYouIllustration className="h-28 w-36" />
      <h1 className="text-center text-heading font-bold text-foreground">
        Seus NFTs agora estão na sua carteira
      </h1>

      <section aria-labelledby="transacao-titulo" className="w-full rounded-sm border border-border py-4">
        <h2 id="transacao-titulo" className="sr-only">
          Transação
        </h2>
        <dl className="grid grid-cols-2 md:grid-cols-4">
          <TransactionFact label="ID da transação">
            <span aria-hidden="true" title={hash}>
              {shortenHash(hash)}
            </span>
            <span className="sr-only">{hash}</span>
          </TransactionFact>
          <TransactionFact label="Data">
            <time dateTime={receipt.issuedAt}>{formatReceiptDate(receipt.issuedAt)}</time>
          </TransactionFact>
          <TransactionFact label="Total">
            <EthValue amount={receipt.summary.totalEth} />
          </TransactionFact>
          <TransactionFact label="Carteira">{receiptWalletLabel(receipt)}</TransactionFact>
        </dl>
      </section>

      <section aria-labelledby="detalhes-titulo" className="flex w-full flex-col gap-4">
        <h2 id="detalhes-titulo" className="text-lead font-bold text-foreground">
          Detalhes da transação
        </h2>
        <div
          aria-hidden="true"
          className="flex justify-between border-b border-border pb-3 text-body-sm font-bold text-text-secondary"
        >
          <span>NFTs</span>
          <span className="flex gap-3">
            <span className="w-12 text-center">Edições</span>
            <span className="min-w-20 text-right">Subtotal</span>
          </span>
        </div>
        <ul aria-label="Itens comprados" className="flex flex-col gap-4">
          {receipt.lines.map((line) => (
            <PurchaseLine key={`${line.nftId}-${line.editionId}`} line={line} />
          ))}
        </ul>
        <dl className="flex flex-col gap-3 border-b border-border pb-4 text-body">
          {isZero(receipt.summary.discountEth) ? null : (
            <div className="flex justify-between gap-4">
              <dt className="text-text-secondary">Desconto do lançamento</dt>
              <dd className="text-foreground">
                (-) <EthValue amount={receipt.summary.discountEth} />
              </dd>
            </div>
          )}
          <div className="flex justify-between gap-4">
            <dt className="text-text-secondary">Taxa de rede</dt>
            <dd className="text-foreground">
              <EthValue amount={receipt.summary.networkFeeEth} />
            </dd>
          </div>
          <div className="flex justify-between gap-4 text-lead font-bold">
            <dt className="text-foreground">Total</dt>
            <dd className="text-text-accent">
              <EthValue amount={receipt.summary.totalEth} />
            </dd>
          </div>
        </dl>
      </section>

      <p className="text-center text-body-sm text-text-secondary">
        Transação confirmada na {networkLabels[network]}. A propriedade foi transferida para sua carteira
        conectada e registrada na rede.
      </p>
      <Button asChild className="w-full rounded-full md:w-auto md:rounded-sm">
        <a href={explorerUrl} target="_blank" rel="noreferrer noopener">
          Ver no {explorerLabels[network]}
          <ExternalLinkIcon aria-hidden="true" className="size-4" />{' '}
        </a>
      </Button>
    </ReceiptCard>
  )
}

function ReceiptSkeleton() {
  return (
    <ReceiptCard busy>
      <Skeleton className="h-28 w-36" />
      <Skeleton className="h-8 w-3/4" />
      <Skeleton className="h-20 w-full rounded-sm" />
      <Skeleton className="h-48 w-full" />
      <Skeleton className="h-10 w-48" />
    </ReceiptCard>
  )
}

/**
 * Confirmação de pedido (Figma): só existe depois que a simulação confirma
 * (R29); antes disso a rota mostra o pedido pendente ou recusado. Os dados vêm
 * do snapshot do recibo, então mudanças posteriores no catálogo não o alteram.
 */
export function ReceiptScreen() {
  const { orderId } = routeApi.useParams()
  const order = useOrder(orderId)
  const receipt = useReceipt(order.data)

  if (order.isError && !order.data) {
    return (
      <div className="mx-auto w-full max-w-content px-6">
        <StatePanel
          role="alert"
          title={
            <h1 className="text-title font-bold text-foreground">
              {isNotFound(order.error) ? 'Pedido não encontrado' : 'Não foi possível carregar o pedido.'}
            </h1>
          }
          actions={
            isNotFound(order.error) ? (
              <Button asChild>
                <Link to="/">Voltar ao Início</Link>
              </Button>
            ) : (
              <Button onClick={() => void order.refetch()}>Tentar novamente</Button>
            )
          }
        />
      </div>
    )
  }

  if (order.data?.status === 'pending') {
    return (
      <ReceiptCard>
        <h1 className="text-center text-heading font-bold text-foreground">Aguardando confirmação</h1>
        <p role="status" className="text-center text-body-sm text-text-secondary">
          Pagamento pendente. O recibo aparece assim que a rede confirmar a transação.
        </p>
      </ReceiptCard>
    )
  }

  if (order.data?.status === 'rejected') {
    return (
      <ReceiptCard>
        <h1 className="text-center text-heading font-bold text-foreground">Compra não concluída</h1>
        <div
          role="alert"
          className="flex flex-col items-center gap-2 text-center text-body-sm text-text-secondary"
        >
          <p className="font-bold text-foreground">Pagamento recusado.</p>
          <p>{order.data.rejectionReason ?? 'Nada foi cobrado.'} Seu carrinho foi mantido.</p>
        </div>
        <Button asChild>
          <Link to="/carrinho">Voltar ao carrinho</Link>
        </Button>
      </ReceiptCard>
    )
  }

  if (receipt.isError && !receipt.data) {
    return (
      <ReceiptCard>
        <div role="alert" className="flex flex-col items-center gap-4 text-center">
          <h1 className="text-title font-bold text-foreground">Não foi possível carregar o recibo.</h1>
          <Button onClick={() => void receipt.refetch()}>Tentar novamente</Button>
        </div>
      </ReceiptCard>
    )
  }

  return receipt.data ? <ConfirmedReceipt receipt={receipt.data} /> : <ReceiptSkeleton />
}
