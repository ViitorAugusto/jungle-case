import * as React from 'react'
import { cn } from '@presentation/lib/utils'

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'h-10 w-full min-w-0 rounded-sm border border-input bg-surface-dark px-3 text-body-sm text-foreground transition-colors outline-none selection:bg-primary selection:text-primary-foreground placeholder:text-subtle disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
        'focus-ring focus-visible:border-ring',
        'aria-invalid:border-destructive aria-invalid:outline-destructive',
        className,
      )}
      {...props}
    />
  )
}

export { Input }
