import { cn } from '@presentation/lib/utils'

/** Bloco de carregamento com shimmer. Recebe as mesmas dimensões do conteúdo final. */
function Skeleton({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div data-slot="skeleton" aria-hidden="true" className={cn('shimmer rounded-sm', className)} {...props} />
  )
}

export { Skeleton }
