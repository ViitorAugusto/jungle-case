import { useRef, useState, type SyntheticEvent } from 'react'

import { validatePasswordChange, validateProfileDraft, type Profile } from '@application/dtos'

import { EnsField } from '@presentation/components/form/ens-field'
import { FormField } from '@presentation/components/form/form-field'
import { PasswordField } from '@presentation/components/form/password-field'
import { AvatarField } from '@presentation/components/profile/avatar-field'
import { Button } from '@presentation/components/ui/button'
import { useChangePassword, useUpdateProfile } from '@presentation/hooks/use-account'
import { userMessageFor } from '@presentation/lib/errors'
import { fieldErrorsOf, focusFirstInvalid, type FieldMessages } from '@presentation/lib/form-errors'
import { notify } from '@presentation/lib/notify'

const NO_PASSWORD = { currentPassword: '', newPassword: '', confirmPassword: '' }

type ProfileValues = {
  readonly displayName: string
  readonly username: string
  readonly email: string
  readonly ensName: string
  readonly walletNickname: string
}

type Field = keyof ProfileValues | keyof typeof NO_PASSWORD

const valuesOf = (profile: Profile): ProfileValues => ({
  displayName: profile.displayName,
  username: profile.username,
  email: profile.email,
  ensName: profile.ensName,
  walletNickname: profile.walletNickname,
})

/** Senha é opcional: só valida (e envia) quando algum dos três campos foi preenchido. */
const passwordErrors = (password: typeof NO_PASSWORD): FieldMessages => {
  if (!password.currentPassword && !password.newPassword && !password.confirmPassword) return {}
  const found: Record<string, readonly string[]> = { ...validatePasswordChange(password) }
  if (password.confirmPassword !== password.newPassword) found.confirmPassword = ['As senhas não conferem']
  return found
}

/**
 * "Perfil do colecionador" (Figma): dados em duas colunas, avatar, "Alterar
 * senha" e um único "Salvar". Validação local antes de qualquer envio; erros
 * da API (422, e-mail ou usuário em uso, senha atual incorreta) voltam ao campo.
 */
export function ProfileForm({
  profile,
  onSaved,
}: {
  readonly profile: Profile
  /** Anúncio do resultado na região `status` da tela. */
  readonly onSaved: (message: string) => void
}) {
  const update = useUpdateProfile()
  const changePassword = useChangePassword()
  const formRef = useRef<HTMLFormElement>(null)
  const [values, setValues] = useState(() => valuesOf(profile))
  const [password, setPassword] = useState(NO_PASSWORD)
  const [errors, setErrors] = useState<FieldMessages>({})
  const busy = update.isPending || changePassword.isPending

  const clearError = (field: Field) => {
    if (errors[field]) {
      setErrors((current) => Object.fromEntries(Object.entries(current).filter(([key]) => key !== field)))
    }
  }
  const setValue = (field: keyof ProfileValues, value: string) => {
    setValues((current) => ({ ...current, [field]: value }))
    clearError(field)
  }
  const setPasswordValue = (field: keyof typeof NO_PASSWORD, value: string) => {
    setPassword((current) => ({ ...current, [field]: value }))
    clearError(field)
  }

  const showErrors = (found: FieldMessages) => {
    setErrors(found)
    focusFirstInvalid(formRef.current)
  }

  const handleFailure = (error: unknown) => {
    const fields = fieldErrorsOf(error)
    if (fields) {
      showErrors(fields)
      return
    }
    const message = userMessageFor(error)
    if (message) notify.error(message)
  }

  const submit = async (event: SyntheticEvent) => {
    event.preventDefault()
    const found = { ...validateProfileDraft(values), ...passwordErrors(password) }
    if (Object.keys(found).length > 0) {
      showErrors(found)
      return
    }
    const withPassword = Boolean(password.currentPassword)
    try {
      const saved = await update.mutateAsync(values)
      setValues(valuesOf(saved))
    } catch (error) {
      handleFailure(error)
      return
    }
    if (!withPassword) {
      onSaved('Alterações salvas.')
      return
    }
    try {
      await changePassword.mutateAsync({
        currentPassword: password.currentPassword,
        newPassword: password.newPassword,
      })
      setPassword(NO_PASSWORD)
      onSaved('Alterações salvas. Senha alterada.')
    } catch (error) {
      onSaved('Alterações salvas. A senha não foi alterada.')
      handleFailure(error)
    }
  }

  return (
    <form
      ref={formRef}
      noValidate
      onSubmit={(event) => {
        void submit(event)
      }}
      className="mt-8.5 flex flex-col gap-8"
    >
      {/* Figma: colunas de 417 px, passo de 103 px entre as linhas e 15 px do rótulo ao campo. */}
      <div className="grid gap-x-7 gap-y-7 md:grid-cols-2 [&>*]:gap-3.75">
        <FormField
          label="Nome de exibição"
          markRequired
          aria-required="true"
          autoComplete="name"
          value={values.displayName}
          errors={errors.displayName}
          onChange={(event) => {
            setValue('displayName', event.target.value)
          }}
        />
        <FormField
          label="Nome de usuário"
          markRequired
          aria-required="true"
          autoComplete="username"
          autoCapitalize="none"
          value={values.username}
          errors={errors.username}
          onChange={(event) => {
            setValue('username', event.target.value)
          }}
        />
        <FormField
          label="E-mail"
          markRequired
          aria-required="true"
          type="email"
          autoComplete="email"
          value={values.email}
          errors={errors.email}
          onChange={(event) => {
            setValue('email', event.target.value)
          }}
        />
        <EnsField
          markRequired
          aria-required="true"
          value={values.ensName}
          errors={errors.ensName}
          onValueChange={(value) => {
            setValue('ensName', value)
          }}
        />
        <FormField
          label="Apelido da carteira"
          markRequired
          aria-required="true"
          value={values.walletNickname}
          errors={errors.walletNickname}
          onChange={(event) => {
            setValue('walletNickname', event.target.value)
          }}
        />
        <AvatarField avatarUrl={profile.avatarUrl} />
      </div>

      <div className="grid gap-x-7 md:grid-cols-2">
        <section aria-labelledby="alterar-senha-titulo" className="flex flex-col gap-5.25 [&>div]:gap-2.5">
          <h2 id="alterar-senha-titulo" className="text-body-lg leading-5 font-bold text-foreground">
            Alterar senha
          </h2>
          <PasswordField
            label="Senha atual"
            autoComplete="current-password"
            value={password.currentPassword}
            errors={errors.currentPassword}
            onChange={(event) => {
              setPasswordValue('currentPassword', event.target.value)
            }}
          />
          <PasswordField
            label="Nova senha"
            autoComplete="new-password"
            hint="Mínimo de 8 caracteres, com letras e números."
            hideHint
            value={password.newPassword}
            errors={errors.newPassword}
            onChange={(event) => {
              setPasswordValue('newPassword', event.target.value)
            }}
          />
          <PasswordField
            label="Confirmar nova senha"
            autoComplete="new-password"
            value={password.confirmPassword}
            errors={errors.confirmPassword}
            onChange={(event) => {
              setPasswordValue('confirmPassword', event.target.value)
            }}
          />
          <Button
            type="submit"
            disabled={busy}
            aria-busy={busy || undefined}
            className="mt-3 w-32.75 self-start rounded-xs px-0 text-body"
          >
            Salvar
          </Button>
        </section>
      </div>
    </form>
  )
}
