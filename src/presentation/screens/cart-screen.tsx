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

/** Figma: 60 px, arredondado e em degradê no mobile; 40 px e cor chapada no desktop. */
const checkoutButtonClass =
  'mt-6.75 h-15 w-full rounded-full bg-(image:--gradient-cta) md:mt-4.75 md:h-10 md:rounded-xs md:bg-none md:text-body'

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

/**
 * Topo do mobile (Figma): voltar circular de 34 px e "Carrinho de NFTs"
 * centralizado. No desktop o título fica só para leitores de tela.
 */
function CartTitle() {
  const router = useRouter()
  return (
    <div className="relative mt-2.25 flex h-8.5 items-center justify-center md:sr-only">
      <Button
        variant="icon-round"
        aria-label="Voltar"
        onClick={() => {
          router.history.back()
        }}
        size="icon"
        className="absolute left-0 size-8.5 rounded-full border-0 text-subtle md:hidden"
      >
        <ChevronLeftIcon aria-hidden="true" className="size-icon-sm" />
      </Button>
      <h1 className="text-title-sm font-bold text-foreground">Carrinho de NFTs</h1>
    </div>
  )
}

/**
 * Carrinho (Figma "Carrinho de NFTs"). Desktop: lista com colunas NFTs · Preço
 * · Edições · Total à esquerda e "Resumo da carteira" à direita, sem painel.
 * Mobile: cards de 100 px e o resumo (cupom, valores e "Conectar e finalizar")
 * fixo na base da tela. Mudanças de preço/estoque em tempo real aparecem como
 * aviso e na linha.
 */
export function CartScreen() {
  const cart = useCart()
  const { changes, dismiss } = useCartChanges()
  const repricing = useIsCartRepricing()
  const blocked = cart.data ? linesOverAvailability(cart.data).length > 0 : false
  const hasLines = Boolean(cart.data && cart.data.lines.length > 0)

  return (
    <div
      className={cn(
        'mx-auto flex w-full max-w-content flex-col px-7 md:px-10 md:pb-0 xl:px-0',
        hasLines && 'pb-(--layout-cart-sheet-height)',
      )}
    >
      <Breadcrumb items={breadcrumb} />
      <CartTitle />
      <CartChangesNotice changes={changes} onDismiss={dismiss} className="not-empty:mt-4" />

      {cart.isError && !cart.data ? (
        <StatePanel
          role="alert"
          className="mt-6"
          title={<p className="text-lead font-bold text-foreground">Não foi possível carregar o carrinho.</p>}
          actions={<Button onClick={() => void cart.refetch()}>Tentar novamente</Button>}
        />
      ) : !cart.data ? (
        <div className="mt-5.25 md:mt-2">
          <CartSkeleton />
        </div>
      ) : cart.data.lines.length === 0 ? (
        <StatePanel
          className="mt-6"
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
        <div className="mt-5.25 grid items-start gap-8 md:mt-2 lg:grid-cols-(--layout-cart-columns) lg:gap-21.5">
          <section aria-labelledby="itens-titulo" className="flex min-w-0 flex-col md:pt-1">
            <h2 id="itens-titulo" className="sr-only">
              Itens do carrinho
            </h2>
            <div
              aria-hidden="true"
              className={cn(
                'hidden border-b border-primary/25 pb-2.75 text-body-lg leading-4 font-medium text-foreground',
                cartLineGrid,
              )}
            >
              <span>NFTs</span>
              <span>Preço</span>
              <span>Edições</span>
              <span>Total</span>
            </div>
            <ul
              aria-label="Itens do carrinho"
              aria-busy={cart.isFetching}
              className="flex flex-col gap-5 md:mt-3 md:gap-3"
            >
              {cart.data.lines.map((line) => (
                <CartLineItem key={line.id} line={line} />
              ))}
            </ul>
          </section>

          <section
            aria-labelledby="resumo-titulo"
            className="fixed inset-x-0 bottom-0 z-30 flex min-w-0 flex-col rounded-t-sheet bg-surface-card px-6 pt-6 pb-9 shadow-field md:static md:z-auto md:rounded-none md:bg-transparent md:p-0 md:shadow-none lg:sticky lg:top-6"
          >
            <h2
              id="resumo-titulo"
              className="border-b border-primary/25 pb-1.75 text-lead font-bold text-foreground max-md:sr-only"
            >
              Resumo da carteira
            </h2>
            <div className="md:mt-6">
              <CouponForm coupon={cart.data.coupon} />
            </div>
            <PriceSummary summary={cart.data.summary} loading={repricing} className="mt-3 md:mt-5.25" />
            {blocked ? (
              <p className="mt-3 text-small text-destructive-foreground">
                Ajuste as quantidades destacadas para continuar.
              </p>
            ) : null}
            {blocked ? (
              <Button disabled className={checkoutButtonClass}>
                Conectar e finalizar
              </Button>
            ) : (
              <Button asChild className={checkoutButtonClass}>
                <Link to="/checkout">Conectar e finalizar</Link>
              </Button>
            )}
            <Link
              to="/"
              hash={CATALOG_ANCHOR}
              className="mt-3 hidden self-center rounded-xs text-body text-text-accent underline-offset-4 focus-ring hover:underline md:block"
            >
              Continuar explorando
            </Link>
          </section>
        </div>
      )}

      {hasLines ? <RelatedForCart /> : null}
    </div>
  )
}
