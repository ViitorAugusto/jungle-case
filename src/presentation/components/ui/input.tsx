import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@presentation/lib/utils'

const inputVariants = cva(
  [
    'w-full min-w-0 border text-body-sm text-foreground transition-colors outline-none selection:bg-primary selection:text-primary-foreground placeholder:text-subtle disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
    'focus-ring focus-visible:border-ring',
    'aria-invalid:border-destructive aria-invalid:outline-destructive',
  ],
  {
    variants: {
      variant: {
        /** Formulários (Figma): fundo transparente, contorno de 1 px na cor Border, 40 px. */
        default: 'h-10 rounded-xs border-border bg-transparent px-3',
        /** Login e cadastro (Figma): só o contorno; 50 px arredondado no mobile, 40 px no modal desktop. */
        auth: 'h-field-lg rounded-field border-border bg-transparent px-4 md:h-10 md:rounded-xs',
      },
    },
    defaultVariants: { variant: 'default' },
  },
)

function Input({
  className,
  type,
  variant,
  ...props
}: React.ComponentProps<'input'> & VariantProps<typeof inputVariants>) {
  return (
    <input type={type} data-slot="input" className={cn(inputVariants({ variant }), className)} {...props} />
  )
}

export { Input }
