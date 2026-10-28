import { Link } from '@tanstack/react-router'
import { Fragment } from 'react'

export type BreadcrumbItem = {
  readonly label: string
  /** Âncora opcional na página inicial (ex.: catálogo). */
  readonly hash?: string
  /** Página atual: texto com aria-current, sem link. */
  readonly current?: boolean
}

/** Trilha do Figma (desktop), ex.: "Início / Mercado / Carrinho". Itens anteriores apontam para seções do Início. */
export function Breadcrumb({ items }: { readonly items: readonly BreadcrumbItem[] }) {
  return (
    <nav aria-label="Trilha de navegação" className="hidden md:block">
      <ol className="flex gap-1 text-body leading-4 font-bold text-foreground">
        {items.map((item, index) => (
          <Fragment key={item.label}>
            {index > 0 ? <li aria-hidden="true">/</li> : null}
            <li>
              {item.current ? (
                <span aria-current="page" className="text-text-accent">
                  {item.label}
                </span>
              ) : (
                <Link
                  to="/"
                  {...(item.hash ? { hash: item.hash } : {})}
                  className="rounded-xs focus-ring hover:text-text-accent"
                >
                  {item.label}
                </Link>
              )}
            </li>
          </Fragment>
        ))}
      </ol>
    </nav>
  )
}
