import { Link } from '@tanstack/react-router'

import { cn } from '@presentation/lib/utils'

type BrandLogoProps = {
  readonly className?: string
  /** No rodapé a marca é só texto; no cabeçalho leva ao início. */
  readonly asLink?: boolean
}

export function BrandLogo({ className, asLink = true }: BrandLogoProps) {
  const wordmark = <span className="text-body-sm font-bold tracking-brand text-foreground">KURIO</span>
  if (!asLink) return <span className={className}>{wordmark}</span>

  return (
    <Link to="/" aria-label="Kurio, página inicial" className={cn('rounded-xs focus-ring', className)}>
      {wordmark}
    </Link>
  )
}
