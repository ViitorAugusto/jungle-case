import { StarIcon } from 'lucide-react'

import { cn } from '@presentation/lib/utils'

const MAX_STARS = 5

type RatingStarsProps = {
  /** Nota de 0 a 5; estrelas cheias = parte inteira (4.8 mostra 4 cheias, como no Figma). */
  readonly value: number
  readonly className?: string
  readonly starClassName?: string
}

/** Fileira de 5 estrelas (cheias em Primary, vazias em Text/Secondary). Decorativa: a nota vai em texto. */
export function RatingStars({ value, className, starClassName }: RatingStarsProps) {
  const filled = Math.floor(Math.min(Math.max(value, 0), MAX_STARS))

  return (
    <span aria-hidden="true" className={cn('inline-flex items-center gap-1', className)}>
      {Array.from({ length: MAX_STARS }, (_, index) => (
        <StarIcon
          key={index}
          strokeWidth={0}
          className={cn(
            'size-3.5 fill-current',
            index < filled ? 'text-primary' : 'text-text-secondary',
            starClassName,
          )}
        />
      ))}
    </span>
  )
}
