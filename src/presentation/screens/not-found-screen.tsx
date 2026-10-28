import { Link } from '@tanstack/react-router'

import { CATALOG_ANCHOR } from '@presentation/components/layout/nav-items'
import { Button } from '@presentation/components/ui/button'

/** Rota inexistente, no mesmo padrão visual dos estados vazios. */
export function NotFoundScreen() {
  return (
    <div className="mx-auto w-full max-w-content px-6 md:px-10 xl:px-0">
      <section className="flex flex-col items-center gap-4 bg-surface-card px-6 py-20 text-center">
        <p aria-hidden="true" className="text-display font-bold text-text-accent">
          404
        </p>
        <h1 className="text-heading font-bold text-foreground">Página não encontrada</h1>
        <p className="max-w-md text-body-sm text-text-secondary">
          O endereço acessado não existe ou foi removido.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Button asChild>
            <Link to="/">Voltar ao início</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/" hash={CATALOG_ANCHOR}>
              Explorar o catálogo
            </Link>
          </Button>
        </div>
      </section>
    </div>
  )
}
