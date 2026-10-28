import type { ReactNode } from 'react'

import { cn } from '@presentation/lib/utils'

type StatePanelProps = {
  /** `alert` para falhas (anunciado pelo leitor de tela). */
  readonly role?: 'alert'
  readonly icon?: ReactNode
  readonly title: ReactNode
  readonly description?: ReactNode
  readonly actions?: ReactNode
  readonly className?: string
}

/** Painel centralizado para estados vazio, erro e não encontrado (mesmo padrão em todas as telas). */
export function StatePanel({ role, icon, title, description, actions, className }: StatePanelProps) {
  return (
    <div
      {...(role ? { role } : {})}
      className={cn('flex flex-col items-center gap-4 bg-surface-card px-6 py-16 text-center', className)}
    >
      {icon}
      {title}
      {description ? <p className="max-w-md text-body-sm text-text-secondary">{description}</p> : null}
      {actions ? <div className="flex flex-wrap justify-center gap-3">{actions}</div> : null}
    </div>
  )
}
