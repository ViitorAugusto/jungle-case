import { getRouteApi, Link, useNavigate } from '@tanstack/react-router'
import { XIcon } from 'lucide-react'
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
import { cn } from '@presentation/lib/utils'

const routeApi = getRouteApi('/_autenticado/pedidos/$orderId')

const isZero = (amount: string) => /^0(\.0*)?$/.test(amount)

/**
 * Card do Figma (578 px) num fundo escuro, sem cabeçalho nem rodapé (modal
 * isolado), com a faixa laranja de 10 px na base; largura total no mobile.
 */
function ReceiptCard({ children, busy }: { readonly children: ReactNode; readonly busy?: boolean }) {
  const navigate = useNavigate()
  return (
    <div className="mx-auto w-full max-w-receipt px-4 md:my-27.5 md:px-0">
      <article
        aria-busy={busy || undefined}
        className="relative flex flex-col items-center border-b-10 border-primary bg-surface-card px-6 pt-5.5 pb-12 md:px-11"
      >
        <Button
          variant="ghost"
          size="icon"
          aria-label="Fechar"
          onClick={() => {
            void navigate({ to: '/' })
          }}
          className="absolute top-2.25 right-1.5 size-8 text-primary hover:bg-transparent hover:text-primary-light"
        >
          <XIcon aria-hidden="true" className="size-icon-sm" />
        </Button>
        {children}
      </article>
    </div>
  )
}

/** Hash como no Figma: "0xA91F…E82C" (prefixo minúsculo, hexadecimal em maiúsculas). */
const displayHash = (hash: string) => {
  const short = shortenHash(hash)
  return short.startsWith('0x') ? `0x${short.slice(2).toUpperCase()}` : short
}

/** Coluna da faixa da transação: rótulo e valor alinhados à esquerda. */
function TransactionFact({
  label,
  strong = false,
  children,
}: {
  readonly label: string
  readonly strong?: boolean
  readonly children: ReactNode
}) {
  return (
    <div className="flex min-w-0 flex-col text-text-secondary">
      <dt className={cn('text-body-sm leading-4.5', strong && 'font-bold')}>{label}</dt>
      <dd className="text-body leading-4.5 break-words">{children}</dd>
    </div>
  )
}

function FactDivider() {
  return <span aria-hidden="true" className="h-7.5 w-px shrink-0 bg-primary max-md:hidden" />
}

function ConfirmedReceipt({ receipt }: { readonly receipt: Receipt }) {
  const { network } = receipt.payment
  const { hash, explorerUrl } = receipt.transaction

  return (
    <ReceiptCard>
      <ThankYouIllustration className="h-20 w-16.5" />
      <h1 className="mt-3.5 text-center text-body-lg leading-5 font-bold text-text-secondary">
        Seus NFTs agora estão na sua carteira
      </h1>

      <section
        aria-labelledby="transacao-titulo"
        className="-mx-6 mt-5 w-[calc(100%+3rem)] border-y border-primary px-6 py-3.5 md:-mx-11 md:w-[calc(100%+5.5rem)] md:px-9"
      >
        <h2 id="transacao-titulo" className="sr-only">
          Transação
        </h2>
        <dl className="grid grid-cols-2 gap-4 md:flex md:items-center md:gap-4.25">
          <TransactionFact label="ID da transação" strong>
            <span aria-hidden="true" title={hash}>
              {displayHash(hash)}
            </span>
            <span className="sr-only">{hash}</span>
          </TransactionFact>
          <FactDivider />
          <TransactionFact label="Data">
            <time dateTime={receipt.issuedAt}>{formatReceiptDate(receipt.issuedAt)}</time>
          </TransactionFact>
          <FactDivider />
          <TransactionFact label="Total">
            <EthValue amount={receipt.summary.totalEth} />
          </TransactionFact>
          <FactDivider />
          <TransactionFact label="Carteira" strong>
            {receiptWalletLabel(receipt)}
          </TransactionFact>
        </dl>
      </section>

      <section aria-labelledby="detalhes-titulo" className="mt-4.75 flex w-full flex-col">
        <h2 id="detalhes-titulo" className="text-body leading-5 font-bold text-foreground">
          Detalhes da transação
        </h2>
        <div
          aria-hidden="true"
          className="mt-1.75 grid grid-cols-(--layout-receipt-line) border-b border-primary/25 pb-2 text-body-lg leading-5 font-medium text-foreground"
        >
          <span>NFTs</span>
          <span className="text-center">Edições</span>
          <span className="text-right">Subtotal</span>
        </div>
        <ul aria-label="Itens comprados" className="mt-3.25 flex flex-col gap-3.25">
          {receipt.lines.map((line) => (
            <PurchaseLine key={`${line.nftId}-${line.editionId}`} line={line} variant="receipt" />
          ))}
        </ul>
        <dl className="mt-2.5 flex flex-col gap-2 border-b border-primary/25 pb-1.75 md:pl-42.25">
          {isZero(receipt.summary.discountEth) ? null : (
            <div className="flex items-center justify-between gap-4">
              <dt className="text-body text-foreground">Desconto do lançamento</dt>
              <dd className="text-lead text-foreground">
                (-) <EthValue amount={receipt.summary.discountEth} />
              </dd>
            </div>
          )}
          <div className="flex items-center justify-between gap-4">
            <dt className="text-body leading-5 text-foreground">Taxa de rede</dt>
            <dd className="text-lead leading-5 text-foreground">
              <EthValue amount={receipt.summary.networkFeeEth} />
            </dd>
          </div>
          <div className="flex items-center justify-between gap-4 font-bold">
            <dt className="text-body-lg text-foreground">Total</dt>
            <dd className="text-lead text-text-accent">
              <EthValue amount={receipt.summary.totalEth} />
            </dd>
          </div>
        </dl>
      </section>

      <p className="mt-3 max-w-117.5 text-center text-body-sm text-text-secondary">
        Transação confirmada na {networkLabels[network]}. A propriedade foi transferida para sua carteira
        conectada e registrada na rede.
      </p>
      <Button asChild className="mt-5 h-12 w-full rounded-full px-4 md:w-auto md:rounded-xs">
        <a href={explorerUrl} target="_blank" rel="noreferrer noopener">
          Ver no {explorerLabels[network]}
          <span className="sr-only"> (abre em nova aba)</span>
        </a>
      </Button>
    </ReceiptCard>
  )
}

function ReceiptSkeleton() {
  return (
    <ReceiptCard busy>
      <Skeleton className="h-20 w-16.5" />
      <Skeleton className="mt-3.5 h-5 w-3/4" />
      <Skeleton className="mt-5 h-17 w-full rounded-none" />
      <Skeleton className="mt-5 h-72 w-full" />
      <Skeleton className="mt-5 h-12 w-46.5" />
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
        <div className="flex flex-col items-center gap-6 pt-10">
          <h1 className="text-center text-heading font-bold text-foreground">Aguardando confirmação</h1>
          <p role="status" className="text-center text-body-sm text-text-secondary">
            Pagamento pendente. O recibo aparece assim que a rede confirmar a transação.
          </p>
        </div>
      </ReceiptCard>
    )
  }

  if (order.data?.status === 'rejected') {
    return (
      <ReceiptCard>
        <div className="flex flex-col items-center gap-6 pt-10">
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
        </div>
      </ReceiptCard>
    )
  }

  if (receipt.isError && !receipt.data) {
    return (
      <ReceiptCard>
        <div role="alert" className="flex flex-col items-center gap-4 pt-10 text-center">
          <h1 className="text-title font-bold text-foreground">Não foi possível carregar o recibo.</h1>
          <Button onClick={() => void receipt.refetch()}>Tentar novamente</Button>
        </div>
      </ReceiptCard>
    )
  }

  return receipt.data ? <ConfirmedReceipt receipt={receipt.data} /> : <ReceiptSkeleton />
}
