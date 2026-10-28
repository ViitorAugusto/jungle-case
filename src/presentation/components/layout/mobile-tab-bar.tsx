import { Link, useRouterState } from '@tanstack/react-router'
import { HeartIcon, HouseIcon, ScanLineIcon, ShoppingCartIcon, UserIcon } from 'lucide-react'
import type { ReactNode } from 'react'

import { CATALOG_ANCHOR } from '@presentation/components/layout/nav-items'
import { DeferredAccountMenu } from '@presentation/components/layout/deferred-account-menu'
import { Badge } from '@presentation/components/ui/badge'
import { useCartCount } from '@presentation/hooks/use-cart'
import { useSession } from '@presentation/hooks/use-session'
import { cn } from '@presentation/lib/utils'

const itemClass = 'focus-ring flex size-11 items-center justify-center rounded-lg'
/** Ícones preenchidos do Figma. */
const iconClass = 'size-5 fill-current'

function CartTab({ label, active, children }: { label: string; active: boolean; children: ReactNode }) {
  return (
    <Link
      to="/carrinho"
      aria-label={label}
      aria-current={active ? 'page' : undefined}
      className={cn(itemClass, active ? 'text-primary' : 'text-text-secondary hover:text-text-accent')}
    >
      {children}
    </Link>
  )
}

/** Telas mobile do Figma sem tab bar: detalhe (barra de compra), login/cadastro (tela cheia), carrinho e pagamento (barra própria) e recibo (modal isolado). */
const hiddenOn = (pathname: string) =>
  pathname.startsWith('/nfts/') ||
  pathname.startsWith('/pedidos/') ||
  ['/login', '/cadastro', '/carrinho', '/checkout'].includes(pathname)

/**
 * Navegação mobile do Figma (< 768 px): Início, Favoritos, atalho central para
 * o catálogo, Carrinho e conta. Visitante vê "Entrar" (volta para a página
 * atual); logado, o mesmo lugar abre o "Menu da conta" (perfil, carteiras, Sair).
 */
export function MobileTabBar() {
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const href = useRouterState({ select: (state) => state.location.href })
  const count = useCartCount()
  const { isAuthenticated } = useSession()
  const homeActive = pathname === '/'

  if (hiddenOn(pathname)) return null

  return (
    <nav aria-label="Navegação principal" className="fixed inset-x-0 bottom-0 z-40 md:hidden">
      {/* Fundo com o recorte: a máscara fica numa camada própria para não cortar o botão central. */}
      <span
        aria-hidden="true"
        className="absolute inset-0 mx-auto max-w-md rounded-t-sheet bg-surface-card tab-bar-notch"
      />
      <ul className="relative mx-auto flex h-24 max-w-md items-center px-6">
        <li>
          <Link
            to="/"
            aria-label="Início"
            aria-current={homeActive ? 'page' : undefined}
            className={cn(
              itemClass,
              homeActive ? 'text-primary' : 'text-text-secondary hover:text-text-accent',
            )}
          >
            <HouseIcon aria-hidden="true" className={iconClass} />
          </Link>
        </li>
        <li className="ml-7">
          <Link
            to="/favoritos"
            aria-label="Favoritos"
            aria-current={pathname === '/favoritos' ? 'page' : undefined}
            className={cn(
              itemClass,
              pathname === '/favoritos' ? 'text-primary' : 'text-text-secondary hover:text-text-accent',
            )}
          >
            <HeartIcon aria-hidden="true" className={iconClass} />
          </Link>
        </li>
        <li className="flex-1">
          {/* Botão central encaixado no recorte côncavo da barra (Figma). */}
          <Link
            to="/"
            hash={CATALOG_ANCHOR}
            aria-label="Explorar catálogo"
            className="absolute -top-8 left-1/2 flex size-16 -translate-x-1/2 items-center justify-center rounded-full bg-linear-to-br from-primary-light/70 to-primary text-foreground focus-ring"
          >
            <ScanLineIcon aria-hidden="true" className="size-7" />
          </Link>
        </li>
        <li>
          <CartTab
            label={count === 1 ? 'Carrinho, 1 item' : `Carrinho, ${count} itens`}
            active={pathname === '/carrinho'}
          >
            <span className="relative">
              <ShoppingCartIcon aria-hidden="true" className={iconClass} />
              {count > 0 ? (
                <Badge variant="count" aria-hidden="true" className="absolute -top-2 -right-2.5">
                  {count > 9 ? '9+' : count}
                </Badge>
              ) : null}
            </span>
          </CartTab>
        </li>
        <li className="ml-5">
          {isAuthenticated ? (
            <DeferredAccountMenu
              side="top"
              trigger={
                <button
                  type="button"
                  aria-label="Menu da conta"
                  className={cn(itemClass, 'cursor-pointer text-text-secondary hover:text-text-accent')}
                >
                  <UserIcon aria-hidden="true" className={iconClass} />
                </button>
              }
            />
          ) : (
            <Link
              to="/login"
              search={href === '/' ? {} : { redirect: href }}
              aria-label="Entrar"
              className={cn(itemClass, 'text-text-secondary hover:text-text-accent')}
            >
              <UserIcon aria-hidden="true" className={iconClass} />
            </Link>
          )}
        </li>
      </ul>
    </nav>
  )
}
