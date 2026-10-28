import { EyeIcon, EyeOffIcon } from 'lucide-react'
import { useState, type ComponentProps } from 'react'

import { FormField } from '@presentation/components/form/form-field'

type PasswordFieldProps = Omit<ComponentProps<typeof FormField>, 'type' | 'trailing'>

/** Campo de senha com o "olho" do Figma (mostrar/ocultar, estado em `aria-pressed`). */
export function PasswordField(props: PasswordFieldProps) {
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
          className="flex size-control cursor-pointer items-center justify-center rounded-xs text-text-secondary focus-ring hover:text-foreground"
        >
          {visible ? (
            <EyeOffIcon aria-hidden="true" className="size-icon-sm" />
          ) : (
            <EyeIcon aria-hidden="true" className="size-icon-sm" />
          )}
        </button>
      }
      {...props}
    />
  )
}
