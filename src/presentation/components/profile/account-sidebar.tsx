import { Link } from '@tanstack/react-router'
import {
  ChartLineIcon,
  CircleAlertIcon,
  DownloadIcon,
  HeartIcon,
  LogOutIcon,
  MapPinIcon,
  ShoppingCartIcon,
  UserIcon,
  type LucideIcon,
} from 'lucide-react'

import { useSignOut } from '@presentation/hooks/use-sign-out'
import { cn } from '@presentation/lib/utils'

export type AccountSection = 'perfil' | 'carteiras'

type SidebarItem =
  | {
      readonly kind: 'link'
      readonly label: string
      readonly icon: LucideIcon
      readonly to: '/perfil' | '/perfil/carteiras' | '/favoritos'
      readonly section?: AccountSection
    }
  | { readonly kind: 'soon'; readonly label: string; readonly icon: LucideIcon }

/** Itens do menu "Meu perfil" (Figma); fora do escopo ficam visíveis como "Em breve" (premissa 24). */
const items: readonly SidebarItem[] = [
  { kind: 'link', label: 'Dados do perfil', icon: UserIcon, to: '/perfil', section: 'perfil' },
  { kind: 'link', label: 'Carteiras', icon: MapPinIcon, to: '/perfil/carteiras', section: 'carteiras' },
  { kind: 'soon', label: 'Atividade', icon: ShoppingCartIcon },
  { kind: 'link', label: 'Lista de interesse', icon: HeartIcon, to: '/favoritos' },
  { kind: 'soon', label: 'Ofertas', icon: ChartLineIcon },
  { kind: 'soon', label: 'Arquivos baixados', icon: DownloadIcon },
  { kind: 'soon', label: 'Suporte', icon: CircleAlertIcon },
]

const itemClass =
  'relative flex min-h-11 shrink-0 items-center gap-3 rounded-xs px-4 text-body-sm whitespace-nowrap focus-ring lg:pl-6'

/**
 * Menu lateral "Meu perfil" (Figma Perfil e Carteiras): item ativo com a
 * barra laranja e `aria-current`. Abaixo de 1024 px vira uma faixa rolável
 * acima do conteúdo.
 */
export function AccountSidebar({ current }: { readonly current: AccountSection }) {
  const { signOut, isPending } = useSignOut()

  return (
    <nav aria-labelledby="meu-perfil-titulo" className="min-w-0 rounded-lg bg-surface-card py-4 lg:py-6">
      <h2 id="meu-perfil-titulo" className="px-4 pb-3 text-lead font-bold text-foreground lg:px-6">
        Meu perfil
      </h2>
      <ul className="flex gap-1 overflow-x-auto px-2 lg:flex-col lg:overflow-visible lg:px-0">
        {items.map((item) => {
          const Icon = item.icon
          if (item.kind === 'soon') {
            return (
              <li key={item.label}>
                <span
                  aria-disabled="true"
                  title="Em breve"
                  className={cn(itemClass, 'cursor-not-allowed text-text-accent/50')}
                >
                  <Icon aria-hidden="true" className="size-icon-sm" />
                  {item.label}
                  <span className="text-micro font-bold text-text-secondary">Em breve</span>
                </span>
              </li>
            )
          }
          const active = item.section === current
          return (
            <li key={item.label}>
              <Link
                to={item.to}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  itemClass,
                  active ? 'font-bold text-text-accent' : 'text-text-accent hover:bg-surface-raised',
                )}
              >
                {active ? (
                  <span
                    aria-hidden="true"
                    className="absolute inset-y-1 left-0 w-1.5 rounded-r-xs bg-primary"
                  />
                ) : null}
                <Icon aria-hidden="true" className="size-icon-sm" />
                {item.label}
              </Link>
            </li>
          )
        })}
        <li className="lg:mt-2 lg:border-t lg:border-border lg:pt-2">
          <button
            type="button"
            onClick={signOut}
            disabled={isPending}
            className={cn(
              itemClass,
              'w-full cursor-pointer text-foreground hover:bg-surface-raised disabled:opacity-50',
            )}
          >
            <LogOutIcon aria-hidden="true" className="size-icon-sm" />
            Sair
          </button>
        </li>
      </ul>
    </nav>
  )
}
