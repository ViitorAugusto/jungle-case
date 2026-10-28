import { Link, useRouter } from '@tanstack/react-router'
import { ChevronLeftIcon, ShoppingCartIcon } from 'lucide-react'
import type { ReactNode } from 'react'

import { isWalletProvider, type CheckoutDraft, type Wallet } from '@application/dtos'

import {
  CheckoutFailureAlert,
  OrderStatusNotice,
  QuoteChangesAlert,
  RecoveringOrderNotice,
} from '@presentation/components/checkout/checkout-alerts'
import { CollectorForm } from '@presentation/components/checkout/collector-form'
import { PriceSummary } from '@presentation/components/checkout/price-summary'
import { PurchaseLine } from '@presentation/components/checkout/purchase-line'
import { ProviderPicker, SavedWallets } from '@presentation/components/checkout/wallet-selection'
import { CartChangesNotice } from '@presentation/components/cart/cart-changes-notice'
import { StatePanel } from '@presentation/components/feedback/state-panel'
import { Breadcrumb } from '@presentation/components/layout/breadcrumb'
import { CATALOG_ANCHOR } from '@presentation/components/layout/nav-items'
import { Button } from '@presentation/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from '@presentation/components/ui/dialog'
import { EthValue } from '@presentation/components/ui/eth-value'
import { Skeleton } from '@presentation/components/ui/skeleton'
import { useWallets } from '@presentation/hooks/use-account'
import { useCart, useCartChanges } from '@presentation/hooks/use-cart'
import { useCheckoutFlow } from '@presentation/hooks/use-checkout-flow'
import { cn } from '@presentation/lib/utils'

const breadcrumb = [
  { label: 'Início' },
  { label: 'Mercado', hash: CATALOG_ANCHOR },
  { label: 'Pagamento', current: true },
] as const

/** Topo do mobile (Figma): voltar circular de 34 px + "Pagamento com carteira". No desktop, só para leitores de tela. */
function CheckoutTitle() {
  const router = useRouter()
  return (
    <div className="mt-2.25 flex h-8.5 items-center gap-6.25 md:sr-only">
      <Button
        variant="icon-round"
        size="icon"
        aria-label="Voltar"
        onClick={() => {
          router.history.back()
        }}
        className="size-8.5 rounded-full border-0 text-subtle md:hidden"
      >
        <ChevronLeftIcon aria-hidden="true" className="size-icon-sm" />
      </Button>
      <h1 className="text-title-sm font-bold text-foreground">Pagamento com carteira</h1>
    </div>
  )
}

/** Mesmo esqueleto de duas colunas da tela pronta (dimensões estáveis). */
function CheckoutSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="Carregando pagamento"
      className="mt-7.5 grid gap-8 lg:grid-cols-(--layout-checkout-columns) lg:gap-8.25"
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
 * Pagamento (Figma "Pagamento"). Desktop: "Perfil do colecionador" à esquerda
 * e, à direita, "Seus NFTs", valores, "Carteira e rede" e um único "Confirmar
 * compra". Mobile: só as carteiras ("Carteira conectada" e "Carteira e rede"),
 * o total e o botão fixo; o formulário aparece quando falta algum dado.
 * "Confirmar compra" conecta a carteira (R25), cota e revalida preço e
 * estoque: se algo mudou, um diálogo mostra as mudanças antes de concluir.
 */
export function CheckoutScreen() {
  const cart = useCart()
  const wallets = useWallets()
  const { changes: cartChanges, dismiss } = useCartChanges()
  const flow = useCheckoutFlow()
  const { form, quote, order, busy } = flow

  const registered = wallets.data ?? []
  const orderPending = order?.status === 'pending'
  const walletLocked = Boolean(form && !form.useOtherWallet && form.payment.walletId)
  const showFormOnMobile = Object.keys(flow.errors).length > 0

  const lines = quote?.lines ?? cart.data?.lines ?? []
  const summary = quote?.summary ?? cart.data?.summary

  if (!form || (!cart.data && !order)) {
    return (
      <Page>
        {cart.isError || wallets.isError ? (
          <StatePanel
            role="alert"
            className="mt-6"
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
          className="mt-6"
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

  const selectedWallet = form.useOtherWallet
    ? null
    : (registered.find((wallet) => wallet.slot === form.payment.walletId) ?? null)

  /** Conexão simulada (R25) quando a carteira ainda não está conectada pelo provedor escolhido. */
  const connectIfNeeded = (wallet: Wallet, provider: string) => {
    if (!isWalletProvider(provider) || (wallet.connected && wallet.provider === provider)) return
    flow.connect(wallet.slot, provider).catch(() => undefined)
  }

  const selectWallet = (wallet: Wallet) => {
    flow.update(withWallet(form, wallet), ['payment.address', 'payment.network', 'payment.provider'])
    connectIfNeeded(wallet, form.payment.provider)
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

  const providerErrors = flow.errors['payment.provider']

  return (
    <Page>
      <CartChangesNotice changes={cartChanges} onDismiss={dismiss} className="not-empty:mt-4" />

      <div className="mt-5.75 grid items-start gap-x-8.25 gap-y-8 pb-28 md:mt-7.5 md:pb-0 lg:grid-cols-(--layout-checkout-columns)">
        <div className={cn('min-w-0', !showFormOnMobile && 'max-md:hidden')}>
          <CollectorForm
            form={form}
            errors={flow.errors}
            onChange={flow.update}
            walletLocked={walletLocked}
            onToggleOtherWallet={toggleOtherWallet}
            wallets={registered}
            onSelectWallet={selectWallet}
            disabled={orderPending}
          />
        </div>

        <div className="flex min-w-0 flex-col">
          {registered.length > 0 ? (
            <SavedWallets
              wallets={registered}
              value={selectedWallet?.slot ?? null}
              onChange={selectWallet}
              onDisconnect={flow.disconnect}
              disabled={orderPending}
              className="md:hidden"
            />
          ) : null}

          <section aria-labelledby="seus-nfts-titulo" className="flex flex-col max-md:hidden">
            <h2 id="seus-nfts-titulo" className="text-body-lg leading-5 font-bold text-foreground">
              Seus NFTs
            </h2>
            <div
              aria-hidden="true"
              className="mt-2 flex justify-between border-b border-primary/25 pb-2 text-body-lg font-medium text-foreground"
            >
              <span>NFTs</span>
              <span>Subtotal</span>
            </div>
            <ul aria-label="Itens do pedido" className="mt-3 flex flex-col gap-3">
              {lines.map((line) => (
                <PurchaseLine key={`${line.nftId}-${line.editionId}`} line={line} />
              ))}
            </ul>

            <p className="mt-2.75 text-center text-body-sm leading-5 text-foreground">
              Tem um código promocional?{' '}
              <Link to="/carrinho" className="rounded-xs underline-offset-4 focus-ring hover:underline">
                Aplique aqui
              </Link>
            </p>

            {summary ? <PriceSummary summary={summary} variant="checkout" className="mt-2" /> : null}
          </section>

          <ProviderPicker
            form={form}
            wallets={registered}
            connection={flow.connection}
            disabled={orderPending}
            onSelectProvider={(provider) => {
              flow.update({ ...form, payment: { ...form.payment, provider } }, ['payment.provider'])
              if (selectedWallet) connectIfNeeded(selectedWallet, provider)
            }}
            onDisconnect={flow.disconnect}
            className="mt-3.75 md:mt-1.75"
          />
          {providerErrors ? (
            <p className="mt-3 flex items-start gap-1 text-small text-destructive-foreground">
              <span aria-hidden="true" className="font-bold">
                !
              </span>
              {providerErrors.join(' ')}
            </p>
          ) : null}

          {summary ? (
            <p className="mt-3.5 flex items-center justify-end gap-7.5 text-lead font-bold md:hidden">
              <span className="text-foreground">Total:</span>
              <EthValue amount={summary.totalEth} className="text-text-accent" />
            </p>
          ) : null}

          <div aria-live="polite" className="mt-4 flex flex-col gap-3 empty:hidden">
            {flow.recovering ? <RecoveringOrderNotice /> : null}
            {order ? <OrderStatusNotice order={order} /> : null}
          </div>
          {flow.failure ? (
            <div className="mt-4">
              <CheckoutFailureAlert
                failure={flow.failure}
                onRetry={flow.retry}
                onReviewAgain={flow.reviewAgain}
                busy={busy}
              />
            </div>
          ) : null}

          <div className="fixed inset-x-0 bottom-0 z-30 px-7 pb-8 md:static md:mt-6.5 md:p-0">
            <Button
              onClick={flow.purchase}
              disabled={busy}
              aria-busy={busy || undefined}
              className="h-15 w-full rounded-full bg-(image:--gradient-cta) md:h-11 md:rounded-xs md:bg-none md:text-body"
            >
              Confirmar compra
            </Button>
          </div>
        </div>
      </div>

      <Dialog
        open={flow.changes.length > 0}
        onOpenChange={(open) => {
          if (!open) flow.edit()
        }}
      >
        <DialogContent className="max-w-md gap-5">
          <DialogTitle className="text-lead font-bold">Revise as mudanças</DialogTitle>
          <DialogDescription className="text-body-sm text-text-secondary">
            Preço ou disponibilidade mudaram desde que você abriu o pagamento.
          </DialogDescription>
          <QuoteChangesAlert changes={flow.changes} />
          {quote ? <PriceSummary summary={quote.summary} variant="checkout" /> : null}
          <DialogFooter>
            <Button variant="outline" onClick={flow.edit}>
              Cancelar
            </Button>
            <Button onClick={flow.confirmChanges} disabled={busy}>
              Confirmar compra
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Page>
  )
}

function Page({ children }: { readonly children: ReactNode }) {
  return (
    <div className="mx-auto flex w-full max-w-content flex-col px-7 md:px-10 xl:px-0">
      <Breadcrumb items={breadcrumb} />
      <CheckoutTitle />
      {children}
    </div>
  )
}
