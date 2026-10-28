import { Link } from '@tanstack/react-router'

import { CATALOG_ANCHOR, type NavItem } from '@presentation/components/layout/nav-items'
import { cn } from '@presentation/lib/utils'

const navLinkClass = 'focus-ring relative flex h-full items-start rounded-xs text-body-lg'

/** Item da navegação principal (cabeçalho e menu em drawer). */
export function NavEntry({
  item,
  active,
  onNavigate,
}: {
  item: NavItem
  active: boolean
  onNavigate?: () => void
}) {
  const underline = active ? (
    <span aria-hidden="true" className="absolute inset-x-0 -bottom-px h-0.75 bg-primary" />
  ) : null

  if (item.kind === 'soon') {
    return (
      <span
        role="link"
        aria-disabled="true"
        title="Em breve"
        className={cn(navLinkClass, 'cursor-not-allowed text-foreground')}
      >
        {item.label}
        <span className="sr-only"> (em breve)</span>
      </span>
    )
  }

  return (
    <Link
      to="/"
      {...(item.kind === 'market' ? { hash: CATALOG_ANCHOR } : {})}
      aria-current={active ? 'page' : undefined}
      {...(onNavigate ? { onClick: onNavigate } : {})}
      className={cn(
        navLinkClass,
        active ? 'font-bold text-text-accent' : 'text-foreground hover:text-text-accent',
      )}
    >
      {item.label}
      {underline}
    </Link>
  )
}
