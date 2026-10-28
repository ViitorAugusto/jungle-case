import type { ReactNode } from 'react'

import { notify } from '@presentation/lib/notify'
import { cn } from '@presentation/lib/utils'

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-5">
      <path
        className="fill-brand-google-blue"
        d="M22.6 12.3c0-.8-.1-1.5-.2-2.3H12v4.3h5.9a5 5 0 0 1-2.2 3.3v2.7h3.6c2-1.9 3.3-4.7 3.3-8Z"
      />
      <path
        className="fill-brand-google-green"
        d="M12 23c3 0 5.5-1 7.3-2.7l-3.6-2.7c-1 .7-2.2 1-3.7 1-2.9 0-5.3-1.9-6.2-4.5H2.1v2.8A11 11 0 0 0 12 23Z"
      />
      <path
        className="fill-brand-google-yellow"
        d="M5.8 14.1a6.6 6.6 0 0 1 0-4.2V7.1H2.1a11 11 0 0 0 0 9.8l3.7-2.8Z"
      />
      <path
        className="fill-brand-google-red"
        d="M12 5.4c1.6 0 3.1.6 4.2 1.7l3.2-3.2A11 11 0 0 0 2.1 7.1l3.7 2.8C6.7 7.3 9.1 5.4 12 5.4Z"
      />
    </svg>
  )
}

/** Só o "f", como no Figma (10 × 20 px). */
function FacebookMark() {
  return (
    <svg viewBox="0 0 10 20" aria-hidden="true" className="h-5 w-2.5 fill-brand-facebook">
      <path d="M6.5 20v-9h3l.5-3.5H6.5V5.3c0-1 .3-1.7 1.8-1.7H10V.5C9.6.4 8.6.3 7.4.3 4.9.3 3.1 1.8 3.1 4.6v2.9H0V11h3.1v9h3.4Z" />
    </svg>
  )
}

function SoonButton({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <button
      type="button"
      aria-disabled="true"
      title="Em breve"
      onClick={() => {
        notify.info(`${label}: em breve.`)
      }}
      className="flex h-10 w-full cursor-not-allowed items-center justify-center gap-3 rounded-sm border border-border bg-transparent text-caption font-medium text-text-secondary focus-ring md:rounded-xs"
    >
      {icon}
      {label}
      <span className="sr-only"> (em breve)</span>
    </button>
  )
}

/**
 * "Ou continue com" Google/Facebook. Login social está fora do escopo (R12):
 * os botões ficam visíveis como no Figma, com `aria-disabled` e "Em breve" no
 * nome acessível, na dica e no aviso ao clicar. No modal desktop o divisor
 * ocupa a largura toda (sai da coluna de 340 px). O frame Desktop/Cadastro
 * afasta mais os botões do divisor e entre si do que o Desktop/Login.
 */
export function SocialLogin({ spacing = 'login' }: { readonly spacing?: 'login' | 'register' }) {
  return (
    <div className="mt-10 flex flex-col md:mt-6">
      <div className="flex items-center gap-3 text-caption text-foreground md:-mx-20">
        <span aria-hidden="true" className="h-px flex-1 bg-border" />
        Ou continue com
        <span aria-hidden="true" className="h-px flex-1 bg-border" />
      </div>
      <div className={cn('mt-3.25 flex flex-col gap-4', spacing === 'register' ? 'md:mt-4.25' : 'md:gap-3')}>
        <SoonButton icon={<GoogleMark />} label="Continuar com Google" />
        <SoonButton icon={<FacebookMark />} label="Continuar com Facebook" />
      </div>
    </div>
  )
}

/** "Esqueceu a senha?": recuperação de senha fora do escopo (R12). */
export function ForgotPasswordSoon() {
  return (
    <button
      type="button"
      aria-disabled="true"
      title="Em breve"
      onClick={() => {
        notify.info('Recuperação de senha: em breve.')
      }}
      className="cursor-not-allowed self-end rounded-xs text-body-sm/4 text-text-accent focus-ring"
    >
      Esqueceu a senha?<span className="sr-only"> (em breve)</span>
    </button>
  )
}
