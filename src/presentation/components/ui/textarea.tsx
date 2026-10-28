import * as React from 'react'
import { cn } from '@presentation/lib/utils'

function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        'min-h-24 w-full min-w-0 rounded-sm border border-input bg-surface-dark px-3 py-2 text-body-sm text-foreground transition-colors outline-none selection:bg-primary selection:text-primary-foreground placeholder:text-subtle disabled:cursor-not-allowed disabled:opacity-50',
        'focus-ring focus-visible:border-ring',
        'aria-invalid:border-destructive aria-invalid:outline-destructive',
        className,
      )}
      {...props}
    />
  )
}

export { Textarea }
