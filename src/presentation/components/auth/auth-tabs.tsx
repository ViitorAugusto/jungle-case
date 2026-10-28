import { Link } from '@tanstack/react-router'

import type { AuthSearch } from '@application/dtos'

import { cn } from '@presentation/lib/utils'

export type AuthMode = 'login' | 'register'

const tabClass = 'rounded-xs text-title-sm font-medium focus-ring'

/**
 * Abas "Entrar | Criar conta" do modal (Figma): centralizadas, separadas por um
 * traço vertical laranja. São links entre /login e /cadastro, preservando o
 * retorno; a ativa fica laranja e marcada com aria-current.
 */
export function AuthTabs({ mode, search }: { readonly mode: AuthMode; readonly search: AuthSearch }) {
  const active = (current: AuthMode) =>
    mode === current ? 'text-text-accent' : 'text-foreground hover:text-text-accent'

  return (
    <nav aria-label="Acesso à conta" className="flex items-center justify-center gap-2">
      <Link
        to="/login"
        search={search}
        replace
        aria-current={mode === 'login' ? 'page' : undefined}
        className={cn(tabClass, active('login'))}
      >
        Entrar
      </Link>
      <span aria-hidden="true" className="h-5 w-0.5 bg-text-coral/50" />
      <Link
        to="/cadastro"
        search={search}
        replace
        aria-current={mode === 'register' ? 'page' : undefined}
        className={cn(tabClass, active('register'))}
      >
        Criar conta
      </Link>
    </nav>
  )
}
