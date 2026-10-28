import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@presentation/lib/utils'
import { Slot } from 'radix-ui'

const badgeVariants = cva(
  'inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden border border-transparent font-medium whitespace-nowrap [&>svg]:pointer-events-none [&>svg]:size-3',
  {
    variants: {
      variant: {
        default: 'rounded-xs bg-primary px-3 py-2 text-caption text-primary-foreground',
        count: 'size-4 rounded-full border-2 border-ink bg-primary text-micro text-primary-foreground',
        outline:
          'rounded-sm border-border-soft bg-surface-dark px-2 py-1 text-nano font-bold text-text-accent',
        muted: 'rounded-xs bg-surface-raised px-2 py-1 text-small text-muted-foreground',
        destructive: 'rounded-xs border-destructive px-2 py-1 text-small text-destructive-foreground',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

function Badge({
  className,
  variant = 'default',
  asChild = false,
  ...props
}: React.ComponentProps<'span'> & VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : 'span'

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
