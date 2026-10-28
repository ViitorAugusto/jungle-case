import { Link } from '@tanstack/react-router'

import type { AuthSearch } from '@application/dtos'

import { cn } from '@presentation/lib/utils'

export type AuthMode = 'login' | 'register'

const tabClass =
  'relative flex-1 rounded-xs pb-3 text-center text-body-lg focus-ring after:absolute after:inset-x-0 after:-bottom-px after:h-0.5'

/**
 * Abas "Entrar | Criar conta" do painel (Figma). São links entre /login e
 * /cadastro, preservando o retorno; a ativa é sublinhada e marcada com aria-current.
 */
export function AuthTabs({ mode, search }: { readonly mode: AuthMode; readonly search: AuthSearch }) {
  const active = (current: AuthMode) =>
    mode === current
      ? 'font-bold text-text-accent after:bg-primary'
      : 'text-foreground hover:text-text-accent'

  return (
    <nav aria-label="Acesso à conta" className="flex border-b border-border">
      <Link
        to="/login"
        search={search}
        replace
        aria-current={mode === 'login' ? 'page' : undefined}
        className={cn(tabClass, active('login'))}
      >
        Entrar
      </Link>
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
