import { Link, useNavigate, useSearch } from '@tanstack/react-router'
import { XIcon } from 'lucide-react'

import { parseAuthSearch } from '@application/dtos'

import { AuthTabs, type AuthMode } from '@presentation/components/auth/auth-tabs'
import { LoginForm } from '@presentation/components/auth/login-form'
import { RegisterForm } from '@presentation/components/auth/register-form'
import { BrandLogo } from '@presentation/components/layout/brand-logo'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@presentation/components/ui/dialog'
import { useMediaQuery } from '@presentation/hooks/use-media-query'
import { cn } from '@presentation/lib/utils'
import { HomeScreen } from '@presentation/screens/home-screen'

const panelTitles: Record<AuthMode, string> = { login: 'Entrar', register: 'Criar conta' }
const panelDescriptions: Record<AuthMode, string> = {
  login: 'Entre para gerenciar sua carteira, coleção e perfil de criador.',
  register: 'Crie seu perfil de colecionador e conecte uma carteira quando quiser.',
}
const screenTitles: Record<AuthMode, string> = { login: 'Entrar', register: 'Criar perfil de colecionador' }

function AuthForm({ mode, registerLabel }: { readonly mode: AuthMode; readonly registerLabel?: string }) {
  const search = parseAuthSearch(useSearch({ strict: false }))
  return mode === 'login' ? (
    <LoginForm search={search} />
  ) : (
    <RegisterForm search={search} {...(registerLabel ? { submitLabel: registerLabel } : {})} />
  )
}

/**
 * Desktop (premissa 22, Figma Desktop/Login e Desktop/Cadastro): o Início com o
 * modal "Entrar | Criar conta" de 500 px centralizado, sem escurecer o fundo.
 * Coluna de 340 px, faixa laranja na base. Dialog modal: foco preso, Esc, o X
 * ou clique fora voltam para o Início.
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
        <DialogContent
          showCloseButton={false}
          overlayClassName="bg-transparent"
          // Foco inicial no próprio diálogo (anuncia título e descrição), não no X.
          onOpenAutoFocus={(event) => {
            event.preventDefault()
            if (event.currentTarget instanceof HTMLElement) event.currentTarget.focus()
          }}
          // Figma: cantos retos no Login e de 4 px no Cadastro.
          className={cn(
            mode === 'login' ? 'rounded-none' : 'rounded-xs',
            'top-(--layout-auth-modal-top) flex max-h-(--layout-auth-modal-max-height) min-h-(--layout-auth-modal-min-height) w-auth-modal translate-y-0 flex-col gap-0 overflow-y-auto border-0 bg-surface-card p-0 shadow-none sm:max-w-auth-modal',
          )}
        >
          <div className="relative flex flex-1 flex-col px-20 pt-11 pb-16.5">
            <DialogClose className="absolute top-0.75 right-1.25 flex size-8 cursor-pointer items-center justify-center rounded-xs text-primary focus-ring hover:text-primary-light">
              <XIcon aria-hidden="true" className="size-icon-sm" />
              <span className="sr-only">Fechar</span>
            </DialogClose>
            <DialogTitle className="sr-only">{panelTitles[mode]}</DialogTitle>
            <AuthTabs mode={mode} search={search} />
            <DialogDescription className="-mx-10 mt-9 text-center text-caption text-foreground">
              {panelDescriptions[mode]}
            </DialogDescription>
            <div className="mt-6">
              <AuthForm mode={mode} />
            </div>
          </div>
          <div aria-hidden="true" className="h-2.5 shrink-0 bg-primary" />
        </DialogContent>
      </Dialog>
    </>
  )
}

/**
 * Mobile (Figma Mobile/Login e Mobile/Cadastro): tela própria, sem cabeçalho,
 * rodapé nem tab bar. Marca grande, título, formulário e o link para a outra tela.
 */
function AuthFullScreen({ mode }: { readonly mode: AuthMode }) {
  const search = parseAuthSearch(useSearch({ strict: false }))
  const other = mode === 'login' ? '/cadastro' : '/login'

  return (
    <div className="mx-auto flex w-full max-w-md flex-col px-7 pt-26 pb-10">
      <BrandLogo size="lg" className="self-center" />
      <h1 className="mt-21 text-center text-title-sm font-bold text-foreground">{screenTitles[mode]}</h1>
      <div className="mt-8.25">
        <AuthForm mode={mode} registerLabel="Criar perfil" />
      </div>
      <p className="mt-10.5 text-center text-body text-text-secondary">
        {mode === 'login' ? 'Novo na Kurio? ' : 'Já tem uma conta? '}
        <Link
          to={other}
          search={search}
          replace
          className="rounded-xs underline-offset-4 focus-ring hover:text-text-accent hover:underline"
        >
          {mode === 'login' ? 'Crie uma conta' : 'Entre'}
        </Link>
      </p>
    </div>
  )
}

/** /login e /cadastro: modal sobre o Início (≥ 768 px) ou tela própria (mobile). */
export function AuthScreen({ mode }: { readonly mode: AuthMode }) {
  const isDesktop = useMediaQuery('(min-width: 768px)')
  return isDesktop ? <AuthPanel mode={mode} /> : <AuthFullScreen mode={mode} />
}
