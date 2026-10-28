import {
  collectFieldErrors,
  validateEmail,
  validateEnsName,
  validateName,
  validateNickname,
  validateUsername,
} from '@domain/value-objects/identity-fields'

export { isEmail, validateEmail, validateName } from '@domain/value-objects/identity-fields'

/** Perfil do colecionador (campos do Figma). */
export type Profile = {
  readonly id: string
  readonly displayName: string
  readonly username: string
  readonly email: string
  /** Nome ENS (`algo.eth`); vazio até o colecionador informar. */
  readonly ensName: string
  /** Apelido da carteira exibido no perfil; vazio até ser informado. */
  readonly walletNickname: string
  readonly avatarUrl: string | null
  readonly updatedAt: string
}

export type ProfileDraft = {
  readonly displayName: string
  readonly username: string
  readonly email: string
  readonly ensName: string
  readonly walletNickname: string
}

export type FieldMessages = Record<string, string[]>

export const PASSWORD_MIN_LENGTH = 8
export const AVATAR_MAX_BYTES = 512 * 1024
export const AVATAR_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp'] as const

/** Política de senha: mínimo de 8 caracteres, com letra e número. */
export const validatePassword = (password: string): string[] => {
  const errors: string[] = []
  if (password.length < PASSWORD_MIN_LENGTH) errors.push(`Use pelo menos ${PASSWORD_MIN_LENGTH} caracteres`)
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) errors.push('Combine letras e números')
  return errors
}

/** Cadastro. `confirmPassword`, quando informado, precisa ser igual à senha. */
export const validateRegistration = (input: {
  name: string
  email: string
  password: string
  confirmPassword?: string
}): FieldMessages =>
  collectFieldErrors({
    name: validateName(input.name),
    email: validateEmail(input.email),
    password: validatePassword(input.password),
    confirmPassword:
      input.confirmPassword !== undefined && input.confirmPassword !== input.password
        ? ['As senhas não conferem']
        : [],
  })

/** Normaliza espaços e caixa onde a regra é insensível a ela. */
export const normalizeProfileDraft = (draft: ProfileDraft): ProfileDraft => ({
  displayName: draft.displayName.trim(),
  username: draft.username.trim().toLowerCase(),
  email: draft.email.trim().toLowerCase(),
  ensName: draft.ensName.trim().toLowerCase(),
  walletNickname: draft.walletNickname.trim(),
})

/** Regras do formulário de perfil; chaves = nomes dos campos. */
export const validateProfileDraft = (raw: ProfileDraft): FieldMessages => {
  const draft = normalizeProfileDraft(raw)
  return collectFieldErrors({
    displayName: validateName(draft.displayName),
    username: validateUsername(draft.username),
    email: validateEmail(draft.email),
    ensName: validateEnsName(draft.ensName),
    walletNickname: validateNickname(draft.walletNickname),
  })
}

export const validatePasswordChange = (input: {
  currentPassword: string
  newPassword: string
}): FieldMessages =>
  collectFieldErrors({
    currentPassword: input.currentPassword ? [] : ['Informe a senha atual'],
    newPassword:
      input.newPassword && input.newPassword === input.currentPassword
        ? ['A nova senha deve ser diferente da atual']
        : validatePassword(input.newPassword),
  })

export const validateAvatar = (file: { type: string; size: number }): FieldMessages =>
  collectFieldErrors({
    avatar: [
      ...((AVATAR_MIME_TYPES as readonly string[]).includes(file.type)
        ? []
        : ['Use uma imagem PNG, JPEG ou WebP']),
      ...(file.size > AVATAR_MAX_BYTES ? ['A imagem deve ter no máximo 512 KB'] : []),
    ],
  })
