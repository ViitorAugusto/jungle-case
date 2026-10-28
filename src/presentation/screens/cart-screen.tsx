import { Link, useRouter } from '@tanstack/react-router'
import { ChevronLeftIcon, ShoppingCartIcon } from 'lucide-react'

import { linesOverAvailability } from '@application/dtos'

import { cartLineGrid } from '@presentation/components/cart/cart-layout'
import { CartChangesNotice } from '@presentation/components/cart/cart-changes-notice'
import { CartLineItem } from '@presentation/components/cart/cart-line-item'
import { CouponForm } from '@presentation/components/cart/coupon-form'
import { RelatedForCart } from '@presentation/components/cart/related-for-cart'
import { PriceSummary } from '@presentation/components/checkout/price-summary'
import { StatePanel } from '@presentation/components/feedback/state-panel'
import { Breadcrumb } from '@presentation/components/layout/breadcrumb'
import { CATALOG_ANCHOR } from '@presentation/components/layout/nav-items'
import { Button } from '@presentation/components/ui/button'
import { Skeleton } from '@presentation/components/ui/skeleton'
import { useCart, useCartChanges, useIsCartRepricing } from '@presentation/hooks/use-cart'
import { cn } from '@presentation/lib/utils'

const breadcrumb = [
  { label: 'Início' },
  { label: 'Mercado', hash: CATALOG_ANCHOR },
  { label: 'Carrinho', current: true },
] as const

function CartSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="Carregando carrinho"
      className="grid gap-8 lg:grid-cols-(--layout-cart-columns) lg:gap-21.5"
    >
      <div className="flex flex-col gap-3">
        {Array.from({ length: 3 }, (_, index) => (
          <Skeleton key={index} className="h-24 rounded-2xl md:h-17.5 md:rounded-none" />
        ))}
      </div>
      <Skeleton className="h-96 rounded-lg" />
    </div>
  )
}

/** Topo do mobile (Figma): voltar + "Carrinho de NFTs". No desktop o título fica só para leitores de tela. */
function CartTitle() {
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
      <h1 className="text-title font-bold text-foreground md:sr-only">Carrinho de NFTs</h1>
    </div>
  )
}

/**
 * Carrinho (Figma "Carrinho de NFTs"): lista com colunas NFTs · Preço · Edições
 * · Total à esquerda e "Resumo da carteira" com cupom à direita. No mobile o
 * resumo fica logo abaixo da lista, como painel arredondado (sem cobrir itens).
 * Mudanças de preço/estoque em tempo real aparecem como aviso e na linha.
 */
export function CartScreen() {
  const cart = useCart()
  const { changes, dismiss } = useCartChanges()
  const repricing = useIsCartRepricing()
  const blocked = cart.data ? linesOverAvailability(cart.data).length > 0 : false

  return (
    <div className="mx-auto flex w-full max-w-content flex-col gap-6 px-6 md:gap-8 md:px-10 xl:px-0">
      <Breadcrumb items={breadcrumb} />
      <CartTitle />
      <CartChangesNotice changes={changes} onDismiss={dismiss} />

      {cart.isError && !cart.data ? (
        <StatePanel
          role="alert"
          title={<p className="text-lead font-bold text-foreground">Não foi possível carregar o carrinho.</p>}
          actions={<Button onClick={() => void cart.refetch()}>Tentar novamente</Button>}
        />
      ) : !cart.data ? (
        <CartSkeleton />
      ) : cart.data.lines.length === 0 ? (
        <StatePanel
          icon={<ShoppingCartIcon aria-hidden="true" className="size-10 text-text-accent" />}
          title={<h2 className="text-title font-bold text-foreground">Seu carrinho está vazio</h2>}
          description="Explore o catálogo e adicione os NFTs que você quer colecionar."
          actions={
            <Button asChild>
              <Link to="/" hash={CATALOG_ANCHOR}>
                Explorar o catálogo
              </Link>
            </Button>
          }
        />
      ) : (
        <div className="grid items-start gap-8 lg:grid-cols-(--layout-cart-columns) lg:gap-21.5">
          <section aria-labelledby="itens-titulo" className="flex min-w-0 flex-col gap-3">
            <h2 id="itens-titulo" className="sr-only">
              Itens do carrinho
            </h2>
            <div
              aria-hidden="true"
              className={cn(
                'hidden border-b border-border pb-3 text-body-sm font-bold text-text-secondary',
                cartLineGrid,
              )}
            >
              <span>NFTs</span>
              <span>Preço</span>
              <span>Edições</span>
              <span>Total</span>
            </div>
            <ul aria-label="Itens do carrinho" aria-busy={cart.isFetching} className="flex flex-col gap-3">
              {cart.data.lines.map((line) => (
                <CartLineItem key={line.id} line={line} />
              ))}
            </ul>
          </section>

          <section
            aria-labelledby="resumo-titulo"
            className="flex min-w-0 flex-col gap-5 rounded-t-sheet bg-surface-raised p-6 shadow-field lg:sticky lg:top-6 lg:rounded-lg lg:bg-surface-card lg:shadow-none"
          >
            <h2 id="resumo-titulo" className="text-title font-bold text-foreground">
              Resumo da carteira
            </h2>
            <CouponForm coupon={cart.data.coupon} />
            <PriceSummary summary={cart.data.summary} loading={repricing} />
            {blocked ? (
              <p className="text-small text-destructive-foreground">
                Ajuste as quantidades destacadas para continuar.
              </p>
            ) : null}
            {blocked ? (
              <Button disabled className="w-full rounded-full lg:rounded-sm">
                Conectar e finalizar
              </Button>
            ) : (
              <Button asChild className="w-full rounded-full lg:rounded-sm">
                <Link to="/checkout">Conectar e finalizar</Link>
              </Button>
            )}
            <Link
              to="/"
              hash={CATALOG_ANCHOR}
              className="self-center rounded-xs text-body-sm text-text-accent underline-offset-4 focus-ring hover:underline"
            >
              Continuar explorando
            </Link>
          </section>
        </div>
      )}

      {cart.data && cart.data.lines.length > 0 ? <RelatedForCart /> : null}
    </div>
  )
}
