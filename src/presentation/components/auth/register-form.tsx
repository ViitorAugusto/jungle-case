import { useRouter } from '@tanstack/react-router'
import { useState, type SyntheticEvent } from 'react'

import {
  afterLoginPath,
  hasReason,
  isApplicationError,
  PASSWORD_MIN_LENGTH,
  type AuthSearch,
  type FieldErrors,
} from '@application/dtos'

import { SocialLogin } from '@presentation/components/auth/social-login'
import { FormField } from '@presentation/components/form/form-field'
import { PasswordField } from '@presentation/components/form/password-field'
import { Button } from '@presentation/components/ui/button'
import { useRegister } from '@presentation/hooks/use-session'
import { userMessageFor } from '@presentation/lib/errors'

const fieldOrder = ['name', 'email', 'password', 'confirmPassword'] as const
type Field = (typeof fieldOrder)[number]

/** Erros por campo: validação (422) e e-mail em uso (409) ficam no campo; o resto vai para o alerta do formulário. */
const fieldErrorsOf = (error: unknown): FieldErrors => {
  if (!isApplicationError(error)) return {}
  if (Object.keys(error.fieldErrors).length > 0) return error.fieldErrors
  if (error.code === 'CONFLICT' || hasReason(error, 'EMAIL_IN_USE')) return { email: [error.message] }
  return {}
}

/** Criar conta. Ao falhar, o foco vai para o primeiro campo inválido; ao concluir, entra e volta ao fluxo anterior. */
export function RegisterForm({ search }: { readonly search: AuthSearch }) {
  const router = useRouter()
  const register = useRegister()
  const [values, setValues] = useState<Record<Field, string>>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  })

  const fieldErrors = fieldErrorsOf(register.error)
  const formMessage =
    register.error && Object.keys(fieldErrors).length === 0 ? userMessageFor(register.error) : null

  const bind = (field: Field) => ({
    name: field,
    value: values[field],
    onChange: (event: { target: { value: string } }) => {
      setValues((current) => ({ ...current, [field]: event.target.value }))
    },
    errors: fieldErrors[field],
  })

  const submit = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = event.currentTarget
    register.mutate(
      {
        name: values.name.trim(),
        email: values.email.trim(),
        password: values.password,
        confirmPassword: values.confirmPassword,
      },
      {
        onSuccess: () => {
          void router.navigate({ href: afterLoginPath(search), replace: true })
        },
        onError: (failure) => {
          const errors = fieldErrorsOf(failure)
          const first = fieldOrder.find((field) => errors[field]?.length)
          const input = first ? form.elements.namedItem(first) : null
          if (input instanceof HTMLInputElement) input.focus()
        },
      },
    )
  }

  return (
    <div className="flex flex-col gap-5">
      {formMessage ? (
        <p
          role="alert"
          className="rounded-sm border border-destructive px-4 py-3 text-body-sm text-destructive-foreground"
        >
          {formMessage}
        </p>
      ) : null}

      <form noValidate onSubmit={submit} className="flex flex-col gap-4">
        <FormField label="Nome de usuário" type="text" autoComplete="name" required {...bind('name')} />
        <FormField label="E-mail" type="email" autoComplete="email" required {...bind('email')} />
        <PasswordField
          label="Senha"
          autoComplete="new-password"
          required
          hint={`Use pelo menos ${PASSWORD_MIN_LENGTH} caracteres.`}
          {...bind('password')}
        />
        <PasswordField
          label="Confirmar senha"
          autoComplete="new-password"
          required
          {...bind('confirmPassword')}
        />
        <Button
          type="submit"
          disabled={register.isPending}
          aria-busy={register.isPending}
          className="mt-1 w-full"
        >
          Criar conta
        </Button>
      </form>
      <SocialLogin />
    </div>
  )
}
