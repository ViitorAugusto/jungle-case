import { EyeIcon, EyeOffIcon } from 'lucide-react'
import { useState, type ComponentProps } from 'react'

import { FormField } from '@presentation/components/form/form-field'
import { cn } from '@presentation/lib/utils'

type PasswordFieldProps = Omit<ComponentProps<typeof FormField>, 'type' | 'trailing'> & {
  /** Classes do botão do "olho" (ex.: ocultá-lo onde o Figma não o mostra). */
  readonly toggleClassName?: string
}

/**
 * Campo de senha com o "olho" do Figma (mostrar/ocultar, estado em `aria-pressed`):
 * olho cortado enquanto os caracteres estão ocultos.
 */
export function PasswordField({ toggleClassName, ...props }: PasswordFieldProps) {
  const [visible, setVisible] = useState(false)

  return (
    <FormField
      type={visible ? 'text' : 'password'}
      trailing={
        <button
          type="button"
          aria-pressed={visible}
          aria-label="Mostrar caracteres digitados"
          onClick={() => {
            setVisible((current) => !current)
          }}
          className={cn(
            'flex size-control cursor-pointer items-center justify-center rounded-xs text-subtle focus-ring hover:text-foreground',
            toggleClassName,
          )}
        >
          {visible ? (
            <EyeIcon aria-hidden="true" className="size-icon-sm" />
          ) : (
            <EyeOffIcon aria-hidden="true" className="size-icon-sm" />
          )}
        </button>
      }
      {...props}
    />
  )
}
