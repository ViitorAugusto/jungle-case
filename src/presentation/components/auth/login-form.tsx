import { useRouter } from '@tanstack/react-router'
import { useRef, useState, type SyntheticEvent } from 'react'

import { afterLoginPath, hasReason, isApplicationError, type AuthSearch } from '@application/dtos'

import { ForgotPasswordSoon, SocialLogin } from '@presentation/components/auth/social-login'
import { FormField } from '@presentation/components/form/form-field'
import { PasswordField } from '@presentation/components/form/password-field'
import { Button } from '@presentation/components/ui/button'
import { useLogin } from '@presentation/hooks/use-session'
import { userMessageFor } from '@presentation/lib/errors'

/**
 * Entrar. Credencial inválida mostra um alerta genérico (sem apontar o campo)
 * e limpa a senha. Volta para `redirect` (só caminhos internos) após entrar.
 */
export function LoginForm({ search }: { readonly search: AuthSearch }) {
  const router = useRouter()
  const login = useLogin()
  const passwordRef = useRef<HTMLInputElement>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const error = login.error
  const fieldErrors = isApplicationError(error) && error.code === 'VALIDATION' ? error.fieldErrors : {}
  const formMessage =
    error && (!isApplicationError(error) || error.code !== 'VALIDATION') ? userMessageFor(error) : null

  const submit = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault()
    login.mutate(
      { email: email.trim(), password },
      {
        onSuccess: () => {
          void router.navigate({ href: afterLoginPath(search), replace: true })
        },
        onError: (failure) => {
          if (isApplicationError(failure) && hasReason(failure, 'INVALID_CREDENTIALS')) {
            setPassword('')
            passwordRef.current?.focus()
          }
        },
      },
    )
  }

  return (
    <div className="flex flex-col gap-5">
      {search.expired ? (
        <p
          role="status"
          className="rounded-sm border border-amber/60 bg-surface-dark px-4 py-3 text-body-sm text-foreground"
        >
          Sua sessão expirou. Entre novamente para continuar de onde parou.
        </p>
      ) : null}
      {formMessage ? (
        <p
          role="alert"
          className="rounded-sm border border-destructive px-4 py-3 text-body-sm text-destructive-foreground"
        >
          {formMessage}
        </p>
      ) : null}

      <form noValidate onSubmit={submit} className="flex flex-col gap-4">
        <FormField
          label="E-mail"
          type="email"
          name="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => {
            setEmail(event.target.value)
          }}
          errors={fieldErrors.email}
        />
        <PasswordField
          ref={passwordRef}
          label="Senha"
          name="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => {
            setPassword(event.target.value)
          }}
          errors={fieldErrors.password}
        />
        <ForgotPasswordSoon />
        <Button type="submit" disabled={login.isPending} aria-busy={login.isPending} className="w-full">
          Entrar
        </Button>
      </form>
      <SocialLogin />
    </div>
  )
}
