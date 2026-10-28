import { Link, useRouterState } from '@tanstack/react-router'
import {
  ChevronDownIcon,
  LogOutIcon,
  MenuIcon,
  SearchIcon,
  ShoppingCartIcon,
  UserIcon,
  XIcon,
} from 'lucide-react'
import { useRef, useState } from 'react'

import { CatalogSearchForm } from '@presentation/components/catalog/catalog-search-form'
import { DeferredAccountMenu } from '@presentation/components/layout/deferred-account-menu'
import { BrandLogo } from '@presentation/components/layout/brand-logo'
import { NavEntry } from '@presentation/components/layout/nav-entry'
import { CATALOG_ANCHOR, mainNavItems, type NavItem } from '@presentation/components/layout/nav-items'
import { Badge } from '@presentation/components/ui/badge'
import { Button } from '@presentation/components/ui/button'
import { useCartCount } from '@presentation/hooks/use-cart'
import { useSession } from '@presentation/hooks/use-session'
import { lazyWithRetry } from '@presentation/lib/lazy-with-retry'
import { cn } from '@presentation/lib/utils'

/** Rotas da jornada de compra: "Mercado" ativo e cabeçalho sem linha inferior (Figma). */
const MARKET_PATHS = ['/nfts/', '/carrinho', '/checkout', '/pedidos/']

function CartLink() {
  const count = useCartCount()
  const label = count === 1 ? 'Carrinho, 1 item' : `Carrinho, ${count} itens`
  return (
    <Link
      to="/carrinho"
      aria-label={label}
      className="relative inline-flex size-8 items-center justify-center rounded-xs text-foreground focus-ring hover:text-text-accent"
    >
      <ShoppingCartIcon aria-hidden="true" className="size-6" />
      {count > 0 ? (
        <Badge variant="count" aria-hidden="true" className="absolute -top-0.5 -right-1">
          {count > 9 ? '9+' : count}
        </Badge>
      ) : null}
    </Link>
  )
}

/** Visitante: "Entrar" (volta para a página atual). Logado: "Menu da conta" com o nome do usuário. */
function AccountAction() {
  const { user } = useSession()
  const href = useRouterState({ select: (state) => state.location.href })

  if (!user) {
    return (
      <Button asChild size="sm" className="h-control gap-1 px-2.25 font-medium">
        <Link to="/login" search={href === '/' ? {} : { redirect: href }}>
          <LogOutIcon aria-hidden="true" />
          Entrar
        </Link>
      </Button>
    )
  }

  return (
    <DeferredAccountMenu
      trigger={
        <Button
          variant="ghost"
          aria-label="Menu da conta"
          className="h-control max-w-48 gap-1 px-2 text-body-sm font-medium"
        >
          <UserIcon aria-hidden="true" className="size-5 shrink-0" />
          <span className="truncate">{user.name}</span>
          <ChevronDownIcon aria-hidden="true" className="size-4 shrink-0" />
        </Button>
      }
    />
  )
}

// Drawer do menu (768–1023 px): baixado no hover/foco ou no primeiro clique em "Abrir menu".
const NavMenuSheet = lazyWithRetry(() => import('@presentation/components/layout/nav-menu-sheet'))

/**
 * Cabeçalho do Figma (≥ 768 px): marca, navegação com item ativo sublinhado,
 * busca, carrinho com contador e Entrar. Entre 768 e 1023 px a navegação
 * vai para um drawer. No mobile a navegação é a tab bar inferior.
 */

export function SiteHeader() {
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const hash = useRouterState({ select: (state) => state.location.hash })
  // A busca do cabeçalho reflete o termo da URL (refresh e histórico).
  const query = useRouterState({
    select: (state) => {
      const value: unknown = (state.location.search as Record<string, unknown>).q
      return typeof value === 'string' ? value : ''
    },
  })
  const [searchOpen, setSearchOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [menuRequested, setMenuRequested] = useState(false)
  const menuButton = useRef<HTMLButtonElement>(null)

  // Figma: Mercado ativo no catálogo, no detalhe, no carrinho e no pagamento; Início no restante.
  const inMarket =
    MARKET_PATHS.some((prefix) => pathname.startsWith(prefix)) ||
    (pathname === '/' && hash === CATALOG_ANCHOR)
  const isActive = (item: NavItem) => (item.kind === 'market' ? inMarket : item.kind === 'home' && !inMarket)
  // Linha inferior só na largura do conteúdo e só onde o Figma a mostra (fora das telas de compra).
  const showRule = !inMarket

  return (
    <header className="hidden md:block">
      <div
        className={cn(
          'mx-auto flex h-search w-full max-w-content items-start justify-between gap-6 px-6 lg:px-10 xl:px-0',
          'border-b',
          showRule ? 'border-primary/25' : 'border-transparent',
        )}
      >
        <div className="flex h-full w-40 items-center">
          <BrandLogo />
        </div>

        <nav aria-label="Principal" className="hidden h-full lg:block">
          <ul className="flex h-full gap-10">
            {mainNavItems.map((item) => (
              <li key={item.label} className="h-full">
                <NavEntry item={item} active={isActive(item)} />
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex h-control items-center gap-7">
          <div className="flex items-center gap-6.5">
            <Button
              variant="ghost"
              size="icon"
              aria-label={searchOpen ? 'Fechar busca' : 'Abrir busca'}
              aria-expanded={searchOpen}
              aria-controls="busca-cabecalho"
              onClick={() => {
                setSearchOpen((open) => !open)
              }}
              className="size-5.5 [&_svg:not([class*='size-'])]:size-5.5"
            >
              {searchOpen ? <XIcon aria-hidden="true" /> : <SearchIcon aria-hidden="true" />}
            </Button>
            <CartLink />
          </div>
          <AccountAction />

          <Button
            ref={menuButton}
            variant="ghost"
            size="icon"
            aria-label="Abrir menu"
            aria-haspopup="dialog"
            aria-expanded={menuOpen}
            onPointerEnter={NavMenuSheet.preload}
            onFocus={NavMenuSheet.preload}
            onClick={() => {
              setMenuRequested(true)
              setMenuOpen(true)
            }}
            className="size-8 lg:hidden"
          >
            <MenuIcon aria-hidden="true" />
          </Button>
          {menuRequested ? (
            <NavMenuSheet.Component
              open={menuOpen}
              onOpenChange={setMenuOpen}
              isActive={isActive}
              returnFocusTo={menuButton}
            />
          ) : null}
        </div>
      </div>

      {searchOpen ? (
        <div id="busca-cabecalho" className="mx-auto w-full max-w-content px-6 pb-4 lg:px-10 xl:px-0">
          <CatalogSearchForm
            key={query}
            defaultValue={query}
            autoFocus
            placeholder="Buscar por nome, coleção ou criador"
            onSubmitted={() => {
              setSearchOpen(false)
            }}
          />
        </div>
      ) : null}
    </header>
  )
}
