import { Link } from '@tanstack/react-router'

import { StatePanel } from '@presentation/components/feedback/state-panel'
import { Button } from '@presentation/components/ui/button'

/**
 * Tela privada cuja interface entra numa fase seguinte. A rota já existe (com
 * a guarda de sessão e o retorno após o login); o conteúdo diz que está a caminho,
 * sem simular a funcionalidade.
 */
export function ComingSoonScreen({ title }: { readonly title: string }) {
  return (
    <div className="mx-auto w-full max-w-content px-6 md:px-10 xl:px-0">
      <StatePanel
        title={<h1 className="text-heading font-bold text-foreground">{title}</h1>}
        description="Esta área estará disponível em breve."
        actions={
          <Button asChild variant="outline">
            <Link to="/">Voltar ao início</Link>
          </Button>
        }
      />
    </div>
  )
}
