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
import { notify } from '@presentation/lib/notify'
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

/**
 * Itens do menu "Meu perfil" (Figma). Os fora do escopo (premissa 24) têm o
 * mesmo visual dos demais, como no frame; "Em breve" fica no nome acessível,
 * na dica e num aviso ao clicar, sem aparentar que funcionam.
 */
const items: readonly SidebarItem[] = [
  { kind: 'link', label: 'Dados do perfil', icon: UserIcon, to: '/perfil', section: 'perfil' },
  { kind: 'link', label: 'Carteiras', icon: MapPinIcon, to: '/perfil/carteiras', section: 'carteiras' },
  { kind: 'soon', label: 'Atividade', icon: ShoppingCartIcon },
  { kind: 'link', label: 'Lista de interesse', icon: HeartIcon, to: '/favoritos' },
  { kind: 'soon', label: 'Ofertas', icon: ChartLineIcon },
  { kind: 'soon', label: 'Arquivos baixados', icon: DownloadIcon },
  { kind: 'soon', label: 'Suporte', icon: CircleAlertIcon },
]

/** Figma: passo de 45 px, ícone em x 18 e texto de 15 px laranja. */
const itemClass =
  'relative flex h-11.25 shrink-0 items-center gap-3 px-4.5 text-body whitespace-nowrap text-text-accent focus-ring'

/**
 * Menu lateral "Meu perfil" (Figma Perfil e Carteiras): item ativo com a
 * barra laranja e `aria-current`. Abaixo de 1024 px vira uma faixa rolável
 * acima do conteúdo.
 */
export function AccountSidebar({ current }: { readonly current: AccountSection }) {
  const { signOut, isPending } = useSignOut()

  return (
    <nav aria-labelledby="meu-perfil-titulo" className="min-w-0 bg-surface-card pt-3.5 pb-2">
      <h2 id="meu-perfil-titulo" className="px-2.5 text-lead font-bold text-foreground">
        Meu perfil
      </h2>
      <ul className="mt-1.5 flex overflow-x-auto lg:flex-col lg:overflow-visible">
        {items.map((item) => {
          const Icon = item.icon
          if (item.kind === 'soon') {
            return (
              <li key={item.label}>
                <button
                  type="button"
                  aria-disabled="true"
                  title="Em breve"
                  onClick={() => {
                    notify.info(`${item.label}: em breve.`)
                  }}
                  className={cn(itemClass, 'w-full cursor-not-allowed')}
                >
                  <Icon aria-hidden="true" className="size-icon-sm" />
                  {item.label}
                  <span className="sr-only"> (Em breve)</span>
                </button>
              </li>
            )
          }
          const active = item.section === current
          return (
            <li key={item.label}>
              <Link
                to={item.to}
                aria-current={active ? 'page' : undefined}
                className={cn(itemClass, active ? '' : 'hover:bg-surface-raised')}
              >
                {active ? (
                  <span aria-hidden="true" className="absolute inset-y-0 left-0 w-1.5 bg-primary" />
                ) : null}
                <Icon aria-hidden="true" className="size-icon-sm" />
                {item.label}
              </Link>
            </li>
          )
        })}
        <li className="lg:border-t lg:border-border">
          <button
            type="button"
            onClick={signOut}
            disabled={isPending}
            className={cn(
              itemClass,
              'h-10 w-full cursor-pointer gap-2 pl-2.5 font-bold hover:bg-surface-raised disabled:opacity-50',
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
