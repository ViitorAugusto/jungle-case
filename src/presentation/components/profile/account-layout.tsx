import type { ReactNode } from 'react'

import { AccountSidebar, type AccountSection } from '@presentation/components/profile/account-sidebar'

type AccountLayoutProps = {
  readonly section: AccountSection
  readonly title: string
  readonly action?: ReactNode
  /** Título só para leitores de tela no desktop (o frame não mostra título). */
  readonly hideTitle?: boolean
  readonly children: ReactNode
}

/**
 * Páginas da conta (Figma Perfil e Carteiras): menu "Meu perfil" de 310 px à
 * esquerda e conteúdo à direita; abaixo de 1024 px o menu vai para o topo.
 */
export function AccountLayout({ section, title, action, hideTitle = false, children }: AccountLayoutProps) {
  return (
    <div className="mx-auto grid w-full max-w-content items-start gap-6 px-6 pt-8 md:px-10 lg:grid-cols-(--layout-catalog-columns) lg:gap-7 xl:px-0">
      <AccountSidebar current={section} />
      <div className="flex min-w-0 flex-col gap-6">
        <div className="flex items-center justify-between gap-4">
          <h1 className={`text-heading font-bold text-foreground ${hideTitle ? 'lg:sr-only' : ''}`}>
            {title}
          </h1>
          {action}
        </div>
        {children}
      </div>
    </div>
  )
}
