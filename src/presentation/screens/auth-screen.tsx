import { Link, useNavigate, useSearch } from '@tanstack/react-router'

import { parseAuthSearch } from '@application/dtos'

import { AuthTabs, type AuthMode } from '@presentation/components/auth/auth-tabs'
import { LoginForm } from '@presentation/components/auth/login-form'
import { RegisterForm } from '@presentation/components/auth/register-form'
import { BrandLogo } from '@presentation/components/layout/brand-logo'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@presentation/components/ui/dialog'
import { useMediaQuery } from '@presentation/hooks/use-media-query'
import { HomeScreen } from '@presentation/screens/home-screen'

const titles: Record<AuthMode, string> = { login: 'Entrar', register: 'Criar conta' }

function AuthForm({ mode }: { readonly mode: AuthMode }) {
  const search = parseAuthSearch(useSearch({ strict: false }))
  return mode === 'login' ? <LoginForm search={search} /> : <RegisterForm search={search} />
}

/**
 * Desktop (premissa 22): o Início com o painel "Entrar | Criar conta" aberto,
 * ancorado abaixo do botão Entrar do cabeçalho. Dialog modal: foco preso,
 * Esc ou "Fechar" voltam para o Início.
 */
function AuthPanel({ mode }: { readonly mode: AuthMode }) {
  const navigate = useNavigate()
  const search = parseAuthSearch(useSearch({ strict: false }))

  return (
    <>
      <HomeScreen />
      <Dialog
        open
        onOpenChange={(open) => {
          if (!open) void navigate({ to: '/' })
        }}
      >
        <DialogContent className="top-18 right-(--layout-content-gutter) left-auto flex max-h-(--layout-panel-max-height) w-100 translate-x-0 translate-y-0 flex-col gap-5 overflow-y-auto rounded-lg border-border p-6 shadow-field sm:max-w-100">
          <DialogTitle className="sr-only">{titles[mode]}</DialogTitle>
          <DialogDescription className="sr-only">
            {mode === 'login' ? 'Acesse sua conta Kurio.' : 'Crie sua conta Kurio.'}
          </DialogDescription>
          <AuthTabs mode={mode} search={search} />
          <AuthForm mode={mode} />
        </DialogContent>
      </Dialog>
    </>
  )
}

/** Mobile (frame Mobile/Login): tela cheia com a marca, o título e o link para a outra tela. */
function AuthFullScreen({ mode }: { readonly mode: AuthMode }) {
  const search = parseAuthSearch(useSearch({ strict: false }))
  const other = mode === 'login' ? '/cadastro' : '/login'

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6 px-6 pb-10">
      <BrandLogo className="self-center" />
      <h1 className="text-heading font-bold text-foreground">{titles[mode]}</h1>
      <AuthForm mode={mode} />
      <p className="text-center text-body-sm text-text-secondary">
        {mode === 'login' ? 'Novo na Kurio? ' : 'Já tem conta? '}
        <Link
          to={other}
          search={search}
          replace
          className="rounded-xs font-bold text-text-accent underline-offset-4 focus-ring hover:underline"
        >
          {mode === 'login' ? 'Criar conta' : 'Entrar'}
        </Link>
      </p>
    </div>
  )
}

/** /login e /cadastro: painel sobre o Início (≥ 768 px) ou tela cheia (mobile). */
export function AuthScreen({ mode }: { readonly mode: AuthMode }) {
  const isDesktop = useMediaQuery('(min-width: 768px)')
  return isDesktop ? <AuthPanel mode={mode} /> : <AuthFullScreen mode={mode} />
}
