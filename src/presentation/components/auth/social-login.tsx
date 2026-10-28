import type { ReactNode } from 'react'

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

function FacebookMark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-5 fill-brand-facebook">
      <path d="M24 12a12 12 0 1 0-13.9 11.9v-8.4H7.1V12h3V9.4c0-3 1.8-4.7 4.5-4.7 1.3 0 2.7.2 2.7.2v3h-1.5c-1.5 0-2 .9-2 1.9V12h3.4l-.5 3.5h-2.9v8.4A12 12 0 0 0 24 12Z" />
    </svg>
  )
}

function SoonButton({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <button
      type="button"
      aria-disabled="true"
      title="Em breve"
      className="flex h-10 flex-1 cursor-not-allowed items-center justify-center gap-2 rounded-sm border border-border bg-surface-dark text-body-sm font-medium text-foreground focus-ring"
    >
      {icon}
      {label}
      <span className="rounded-xs bg-surface-raised px-1.5 text-nano font-bold text-text-secondary">
        EM BREVE
      </span>
    </button>
  )
}

/**
 * "Ou continue com" Google/Facebook. Login social está fora do escopo (R12):
 * os botões ficam visíveis, desabilitados e marcados "Em breve".
 */
export function SocialLogin() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3 text-small text-text-secondary">
        <span aria-hidden="true" className="h-px flex-1 bg-border" />
        Ou continue com
        <span aria-hidden="true" className="h-px flex-1 bg-border" />
      </div>
      <div className="flex gap-3">
        <SoonButton icon={<GoogleMark />} label="Google" />
        <SoonButton icon={<FacebookMark />} label="Facebook" />
      </div>
    </div>
  )
}

/** "Esqueceu a senha?" — recuperação de senha fora do escopo (R12). */
export function ForgotPasswordSoon() {
  return (
    <button
      type="button"
      aria-disabled="true"
      title="Em breve"
      className="cursor-not-allowed self-end rounded-xs text-small font-medium text-text-accent/70 focus-ring"
    >
      Esqueceu a senha? <span className="text-nano font-bold">(em breve)</span>
    </button>
  )
}
