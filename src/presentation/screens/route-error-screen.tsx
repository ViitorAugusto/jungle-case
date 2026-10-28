import { useRouter, type ErrorComponentProps } from '@tanstack/react-router'

import { StatePanel } from '@presentation/components/feedback/state-panel'
import { Button } from '@presentation/components/ui/button'

/**
 * Erro de rota: código da tela que não baixou (offline) ou falha inesperada.
 * "Tentar de novo" revalida a rota sem recarregar a página.
 */
export function RouteErrorScreen({ reset }: ErrorComponentProps) {
  const router = useRouter()

  return (
    <div className="mx-auto w-full max-w-content px-6 md:px-10 xl:px-0">
      <StatePanel
        role="alert"
        title={<h1 className="text-heading font-bold text-foreground">Não foi possível abrir esta página</h1>}
        description="Verifique sua conexão e tente de novo."
        actions={
          <Button
            onClick={() => {
              reset()
              void router.invalidate()
            }}
          >
            Tentar de novo
          </Button>
        }
      />
    </div>
  )
}
