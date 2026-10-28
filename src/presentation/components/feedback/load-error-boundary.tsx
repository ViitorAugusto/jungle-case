import { Component, type ReactNode } from 'react'

import { Button } from '@presentation/components/ui/button'

type LoadErrorBoundaryProps = {
  readonly children: ReactNode
  readonly onRetry: () => void
  /** Substitui o aviso padrão (ex.: `null` para partes não essenciais, como o Toaster). */
  readonly fallback?: ReactNode
}

type LoadErrorBoundaryState = { readonly failed: boolean }

/**
 * Isola a falha de um trecho carregado sob demanda (ex.: chunk que não baixou
 * offline): mostra "Tentar de novo" no lugar do trecho em vez de derrubar a tela.
 */
export class LoadErrorBoundary extends Component<LoadErrorBoundaryProps, LoadErrorBoundaryState> {
  override state: LoadErrorBoundaryState = { failed: false }

  static getDerivedStateFromError(): LoadErrorBoundaryState {
    return { failed: true }
  }

  override render() {
    if (!this.state.failed) return this.props.children
    if (this.props.fallback !== undefined) return this.props.fallback

    return (
      <div role="alert" className="flex flex-wrap items-center gap-3 text-body-sm text-text-secondary">
        Não foi possível carregar esta parte. Verifique sua conexão.
        <Button size="xs" variant="outline" onClick={this.props.onRetry}>
          Tentar de novo
        </Button>
      </div>
    )
  }
}
