import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@presentation/lib/utils'
import { Slot } from 'radix-ui'

const buttonVariants = cva(
  "inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-sm font-bold whitespace-nowrap focus-ring transition-colors disabled:pointer-events-none disabled:opacity-50 aria-disabled:cursor-not-allowed aria-disabled:opacity-50 aria-invalid:outline-destructive [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-5",
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary-light active:bg-primary-dark',
        destructive: 'bg-destructive text-foreground hover:bg-destructive/90',
        outline:
          'border border-border bg-transparent text-foreground hover:border-primary hover:text-text-accent',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-surface-raised',
        ghost: 'text-foreground hover:bg-surface-raised hover:text-text-accent',
        link: 'text-text-accent underline-offset-4 hover:underline',
        /** Botão circular de ícone do Figma (voltar, favoritar): 35 px, Surface Raised com borda. */
        'icon-round':
          'size-control rounded-full border border-border bg-surface-raised p-0 text-foreground hover:border-primary hover:text-text-accent',
      },
      size: {
        default: 'h-10 px-7 text-body-lg',
        sm: 'h-9 px-3 text-body-lg',
        xs: 'h-8 px-3 text-small',
        lg: 'h-12 px-8 text-lead',
        icon: 'size-control rounded-xs text-lead font-normal',
        'icon-sm': 'size-7 rounded-full',
        'icon-lg': 'size-11 rounded-lg',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

function Button({
  className,
  variant = 'default',
  size = 'default',
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : 'button'

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
