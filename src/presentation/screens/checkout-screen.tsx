import { Link, useRouter } from '@tanstack/react-router'
import { ChevronLeftIcon, ShoppingCartIcon } from 'lucide-react'
import type { ReactNode } from 'react'

import type { CheckoutDraft, Wallet } from '@application/dtos'

import {
  CheckoutFailureAlert,
  OrderStatusNotice,
  OutdatedQuoteAlert,
  QuoteChangesAlert,
  RecoveringOrderNotice,
} from '@presentation/components/checkout/checkout-alerts'
import { CollectorForm } from '@presentation/components/checkout/collector-form'
import { PriceSummary } from '@presentation/components/checkout/price-summary'
import { PurchaseLine } from '@presentation/components/checkout/purchase-line'
import { WalletSelection } from '@presentation/components/checkout/wallet-selection'
import { CartChangesNotice } from '@presentation/components/cart/cart-changes-notice'
import { StatePanel } from '@presentation/components/feedback/state-panel'
import { Breadcrumb } from '@presentation/components/layout/breadcrumb'
import { CATALOG_ANCHOR } from '@presentation/components/layout/nav-items'
import { Button } from '@presentation/components/ui/button'
import { EthValue } from '@presentation/components/ui/eth-value'
import { Skeleton } from '@presentation/components/ui/skeleton'
import { useWallets } from '@presentation/hooks/use-account'
import { useCart, useCartChanges } from '@presentation/hooks/use-cart'
import { useCheckoutFlow } from '@presentation/hooks/use-checkout-flow'
import { networkLabelOf } from '@presentation/components/nft/network-labels'
import { shortenHash } from '@presentation/lib/format'

const breadcrumb = [
  { label: 'Início' },
  { label: 'Mercado', hash: CATALOG_ANCHOR },
  { label: 'Pagamento', current: true },
] as const

/** Topo do mobile (Figma): voltar + "Pagamento com carteira". No desktop o título fica para leitores de tela. */
function CheckoutTitle() {
  const router = useRouter()
  return (
    <div className="flex items-center gap-4">
      <Button
        variant="icon-round"
        aria-label="Voltar"
        onClick={() => {
          router.history.back()
        }}
        className="md:hidden"
      >
        <ChevronLeftIcon aria-hidden="true" />
      </Button>
      <h1 className="text-title font-bold text-foreground md:sr-only">Pagamento com carteira</h1>
    </div>
  )
}

/** Mesmo esqueleto de duas colunas da tela pronta (dimensões estáveis). */
function CheckoutSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="Carregando pagamento"
      className="grid gap-8 lg:grid-cols-(--layout-checkout-columns) lg:gap-16"
    >
      <div className="grid gap-5 md:grid-cols-2">
        <Skeleton className="h-8 w-64 md:col-span-2" />
        {Array.from({ length: 9 }, (_, index) => (
          <Skeleton key={index} className="h-18 rounded-sm" />
        ))}
        <Skeleton className="h-32 rounded-sm md:col-span-2" />
      </div>
      <Skeleton className="h-150 rounded-lg" />
    </div>
  )
}

/** Escolher a carteira cadastrada copia endereço e rede dela e sai do modo manual. */
const withWallet = (form: CheckoutDraft, wallet: Wallet): CheckoutDraft => ({
  ...form,
  useOtherWallet: false,
  payment: {
    ...form.payment,
    walletId: wallet.slot,
    address: wallet.address,
    network: wallet.network,
    provider: wallet.provider,
  },
})

/**
 * Pagamento (Figma "Pagamento"): "Perfil do colecionador" à esquerda e "Seus
 * NFTs" à direita, com valores da cotação, carteira e provedor. O botão diz
 * "Revisar pedido" até haver cotação; na revisão o formulário e o resumo
 * travam, mudanças aparecem como alerta e o botão vira "Confirmar compra".
 */
export function CheckoutScreen() {
  const cart = useCart()
  const wallets = useWallets()
  const { changes: cartChanges, dismiss } = useCartChanges()
  const flow = useCheckoutFlow()
  const { form, quote, order } = flow

  const registered = wallets.data ?? []
  const reviewing = quote !== null
  const orderPending = order?.status === 'pending'
  const orderRejected = order?.status === 'rejected'
  const locked = reviewing || orderPending
  const walletLocked = Boolean(form && !form.useOtherWallet && form.payment.walletId)
  // Provedor escolhido para a carteira cadastrada sem conexão ativa (ex.: recusada): não há o que revisar.
  const chosenWallet = walletLocked
    ? registered.find((wallet) => wallet.slot === form?.payment.walletId)
    : undefined
  const awaitingConnection = Boolean(
    chosenWallet &&
    form?.payment.provider &&
    !(chosenWallet.connected && chosenWallet.provider === form.payment.provider),
  )

  const lines = quote?.lines ?? cart.data?.lines ?? []
  const summary = quote?.summary ?? cart.data?.summary
  const busy = flow.isQuoting || flow.isSubmitting || orderPending

  if (!form || (!cart.data && !order)) {
    return (
      <Page>
        {cart.isError || wallets.isError ? (
          <StatePanel
            role="alert"
            title={
              <p className="text-lead font-bold text-foreground">Não foi possível carregar o pagamento.</p>
            }
            actions={
              <Button
                onClick={() => {
                  void cart.refetch()
                  void wallets.refetch()
                }}
              >
                Tentar novamente
              </Button>
            }
          />
        ) : (
          <CheckoutSkeleton />
        )}
      </Page>
    )
  }

  if (lines.length === 0 && !order) {
    return (
      <Page>
        <StatePanel
          icon={<ShoppingCartIcon aria-hidden="true" className="size-10 text-text-accent" />}
          title={<h2 className="text-title font-bold text-foreground">Seu carrinho está vazio</h2>}
          description="Adicione NFTs ao carrinho para seguir para o pagamento."
          actions={
            <Button asChild>
              <Link to="/" hash={CATALOG_ANCHOR}>
                Explorar o catálogo
              </Link>
            </Button>
          }
        />
      </Page>
    )
  }

  const toggleOtherWallet = (checked: boolean) => {
    const primary = registered.find((wallet) => wallet.slot === 'primary') ?? registered[0]
    if (!checked && primary) {
      flow.update(withWallet(form, primary), ['payment.address', 'payment.network', 'payment.provider'])
      return
    }
    flow.update({ ...form, useOtherWallet: checked, payment: { ...form.payment, walletId: null } }, [
      'payment.provider',
    ])
  }

  const primaryAction = () => {
    if (orderRejected) {
      flow.startOver()
      flow.review()
      return
    }
    if (reviewing) flow.confirm()
    else flow.review()
  }

  return (
    <Page>
      <CartChangesNotice changes={cartChanges} onDismiss={dismiss} />

      <div className="grid items-start gap-8 lg:grid-cols-(--layout-checkout-columns) lg:gap-16">
        <div className="flex min-w-0 flex-col gap-4">
          <CollectorForm
            form={form}
            errors={flow.errors}
            onChange={flow.update}
            walletLocked={walletLocked}
            onToggleOtherWallet={toggleOtherWallet}
            disabled={locked}
          />
          {reviewing && !orderPending ? (
            <Button variant="link" onClick={flow.edit} className="self-start px-0">
              Editar dados
            </Button>
          ) : null}
        </div>

        <section
          aria-labelledby="seus-nfts-titulo"
          className="flex min-w-0 flex-col gap-6 rounded-lg bg-surface-card p-6 lg:sticky lg:top-6"
        >
          <h2 id="seus-nfts-titulo" className="text-title font-bold text-foreground">
            Seus NFTs
          </h2>

          <div>
            <div
              aria-hidden="true"
              className="flex justify-between border-b border-border pb-3 text-body-sm font-bold text-text-secondary"
            >
              <span>NFTs</span>
              <span>Subtotal</span>
            </div>
            <ul aria-label="Itens do pedido" className="flex flex-col gap-4 pt-4">
              {lines.map((line) => (
                <PurchaseLine key={`${line.nftId}-${line.editionId}`} line={line} />
              ))}
            </ul>
          </div>

          {reviewing ? null : (
            <p className="text-body-sm text-text-secondary">
              Tem um código promocional?{' '}
              <Link
                to="/carrinho"
                className="rounded-xs text-text-accent underline-offset-4 focus-ring hover:underline"
              >
                Aplique aqui
              </Link>
            </p>
          )}

          {summary ? <PriceSummary summary={summary} /> : null}

          {reviewing ? (
            <dl className="flex flex-col gap-2 rounded-sm border border-border p-4 text-body-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-text-secondary">Colecionador</dt>
                <dd className="truncate text-foreground">{form.collector.displayName}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-text-secondary">E-mail</dt>
                <dd className="truncate text-foreground">{form.collector.email}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-text-secondary">Carteira</dt>
                <dd className="text-foreground">
                  {shortenHash(form.payment.address)}
                  {networkLabelOf(form.payment.network) ? ` · ${networkLabelOf(form.payment.network)}` : null}
                </dd>
              </div>
            </dl>
          ) : null}

          <div className="flex flex-col gap-4">
            <h3 className="text-lead font-bold text-foreground">Carteira e rede</h3>
            <WalletSelection
              form={form}
              wallets={registered}
              errors={flow.errors}
              disabled={locked}
              onSelectWallet={(wallet) => {
                flow.update(withWallet(form, wallet), [
                  'payment.address',
                  'payment.network',
                  'payment.provider',
                ])
              }}
              onSelectProvider={(provider) => {
                flow.update({ ...form, payment: { ...form.payment, provider } }, ['payment.provider'])
              }}
            />
          </div>

          <div aria-live="polite" className="flex flex-col gap-3 empty:hidden">
            {flow.recovering ? <RecoveringOrderNotice /> : null}
            {order ? <OrderStatusNotice order={order} /> : null}
          </div>
          {flow.changes.length > 0 ? <QuoteChangesAlert changes={flow.changes} /> : null}
          {flow.failure ? (
            <CheckoutFailureAlert
              failure={flow.failure}
              onRetry={flow.retry}
              onReviewAgain={flow.reviewAgain}
              busy={busy}
            />
          ) : null}

          <div className="flex flex-col gap-3 max-md:sticky max-md:bottom-0 max-md:-mx-6 max-md:-mb-6 max-md:rounded-t-sheet max-md:bg-surface-raised max-md:p-6">
            {summary ? (
              <p className="flex justify-between text-lead font-bold md:hidden">
                <span className="text-foreground">Total:</span>
                <EthValue amount={summary.totalEth} className="text-text-accent" />
              </p>
            ) : null}
            {reviewing && flow.outdated && !orderPending ? (
              <OutdatedQuoteAlert onReviewAgain={flow.reviewAgain} busy={busy} />
            ) : (
              <Button
                onClick={primaryAction}
                disabled={busy || (!reviewing && awaitingConnection)}
                aria-busy={busy || undefined}
                className="w-full rounded-full lg:rounded-sm"
              >
                {reviewing && !orderRejected ? 'Confirmar compra' : 'Revisar pedido'}
              </Button>
            )}
            {!reviewing && awaitingConnection ? (
              <p className="text-center text-small text-text-secondary">
                Conecte a carteira para revisar o pedido.
              </p>
            ) : null}
          </div>
        </section>
      </div>
    </Page>
  )
}

function Page({ children }: { readonly children: ReactNode }) {
  return (
    <div className="mx-auto flex w-full max-w-content flex-col gap-6 px-6 md:gap-8 md:px-10 xl:px-0">
      <Breadcrumb items={breadcrumb} />
      <CheckoutTitle />
      {children}
    </div>
  )
}
