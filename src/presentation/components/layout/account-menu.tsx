import { Link } from '@tanstack/react-router'
import { HeartIcon, LogOutIcon, UserIcon, WalletIcon } from 'lucide-react'
import type { ReactNode } from 'react'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@presentation/components/ui/dropdown-menu'
import { useSession } from '@presentation/hooks/use-session'
import { useSignOut } from '@presentation/hooks/use-sign-out'

type AccountMenuProps = {
  /** Botão que abre o menu (cabeçalho ou tab bar); recebe o nome acessível "Menu da conta". */
  readonly trigger: ReactNode
  readonly align?: 'start' | 'end'
  readonly side?: 'top' | 'bottom'
  /** Abre já montado (carregado sob demanda a partir do primeiro clique no gatilho). */
  readonly defaultOpen?: boolean
}

const itemClass = 'cursor-pointer gap-2 text-body-sm'

/** Menu do usuário logado: perfil, carteiras, favoritos e "Sair". */
export function AccountMenu({
  trigger,
  align = 'end',
  side = 'bottom',
  defaultOpen = false,
}: AccountMenuProps) {
  const { user } = useSession()
  const { signOut, isPending } = useSignOut()

  return (
    <DropdownMenu defaultOpen={defaultOpen}>
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      <DropdownMenuContent align={align} side={side} className="w-56">
        {user ? (
          <DropdownMenuLabel className="truncate text-small text-text-secondary">
            {user.email}
          </DropdownMenuLabel>
        ) : null}
        <DropdownMenuItem asChild className={itemClass}>
          <Link to="/perfil">
            <UserIcon aria-hidden="true" />
            Meu perfil
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className={itemClass}>
          <Link to="/perfil/carteiras">
            <WalletIcon aria-hidden="true" />
            Carteiras
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className={itemClass}>
          <Link to="/favoritos">
            <HeartIcon aria-hidden="true" />
            Favoritos
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className={itemClass} disabled={isPending} onSelect={signOut}>
          <LogOutIcon aria-hidden="true" />
          Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default AccountMenu
