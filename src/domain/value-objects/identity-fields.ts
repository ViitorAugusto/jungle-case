/**
 * Regras de campo compartilhadas por perfil, carteira e pagamento (mesmos
 * campos do Figma nas três telas). Cada função devolve as mensagens de erro;
 * lista vazia = válido.
 */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
export const USERNAME_PATTERN = /^[a-z0-9_]{3,20}$/
/** ENS: rótulos minúsculos (letras, dígitos, hífen) terminando em `.eth`; nome com 3+ caracteres. */
export const ENS_PATTERN = /^(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)*[a-z0-9][a-z0-9-]{1,61}[a-z0-9]\.eth$/
/** Código de indicação: 3 letras maiúsculas, hífen e 4 dígitos (ex.: `JNG-2026`). */
export const REFERRAL_CODE_PATTERN = /^[A-Z]{3}-\d{4}$/

export const isEmail = (value: string) => EMAIL_PATTERN.test(value.trim())
export const isEnsName = (value: string) => ENS_PATTERN.test(value.trim())

const lengthBetween = (value: string, min: number, max: number) => {
  const length = value.trim().length
  return length >= min && length <= max
}

export const validateName = (name: string): string[] =>
  lengthBetween(name, 2, 60) ? [] : ['Informe um nome entre 2 e 60 caracteres']

export const validateEmail = (email: string): string[] => (isEmail(email) ? [] : ['Informe um e-mail válido'])

export const validateUsername = (username: string): string[] =>
  USERNAME_PATTERN.test(username.trim()) ? [] : ['Use de 3 a 20 letras minúsculas, números ou _']

export const validateEnsName = (ensName: string): string[] =>
  isEnsName(ensName) ? [] : ['Informe um nome ENS terminado em .eth']

export const validateReferralCode = (code: string): string[] =>
  REFERRAL_CODE_PATTERN.test(code.trim()) ? [] : ['Use 3 letras, hífen e 4 dígitos (ex.: JNG-2026)']

/** Apelido da carteira (perfil e cadastro de carteira). */
export const validateNickname = (nickname: string): string[] =>
  lengthBetween(nickname, 2, 40) ? [] : ['Informe um apelido entre 2 e 40 caracteres']

/** Junta erros por campo descartando os válidos (lista vazia). */
export const collectFieldErrors = (entries: Record<string, string[]>): Record<string, string[]> =>
  Object.fromEntries(Object.entries(entries).filter(([, messages]) => messages.length > 0))

/** Prefixa as chaves (`ensName` → `collector.ensName`) para formulários aninhados. */
export const prefixFieldErrors = (prefix: string, errors: Record<string, string[]>) =>
  Object.fromEntries(Object.entries(errors).map(([field, messages]) => [`${prefix}.${field}`, messages]))
