import { Link } from '@tanstack/react-router'

import { cn } from '@presentation/lib/utils'

type BrandLogoProps = {
  readonly className?: string
  /** No rodapé a marca é só texto; no cabeçalho leva ao início. */
  readonly asLink?: boolean
  /** `lg`: marca grande do topo do login e do cadastro mobile (Figma). */
  readonly size?: 'default' | 'lg'
}

export function BrandLogo({ className, asLink = true, size = 'default' }: BrandLogoProps) {
  const wordmark = (
    <span
      className={cn(
        'font-bold tracking-brand text-foreground',
        size === 'lg' ? 'text-heading-xl' : 'text-body-sm',
      )}
    >
      KURIO
    </span>
  )
  if (!asLink) return <span className={className}>{wordmark}</span>

  return (
    <Link to="/" aria-label="Kurio, página inicial" className={cn('rounded-xs focus-ring', className)}>
      {wordmark}
    </Link>
  )
}
