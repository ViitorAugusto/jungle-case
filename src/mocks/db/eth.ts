/**
 * Aritmética de ETH do servidor simulado (wei em `bigint`, entrada e saída em
 * string decimal). Independente do domínio do cliente, como seria um backend real.
 */
const DECIMALS = 18
const SCALE = 10n ** BigInt(DECIMALS)
const PATTERN = /^(\d+)(?:\.(\d{1,18}))?$/

export const isEth = (value: string) => PATTERN.test(value)

export const toWei = (value: string): bigint => {
  const match = PATTERN.exec(value)
  if (!match) throw new Error(`ETH inválido: ${value}`)
  const [, integer = '0', fraction = ''] = match
  return BigInt(integer) * SCALE + BigInt(fraction.padEnd(DECIMALS, '0'))
}

export const fromWei = (wei: bigint): string => {
  const negative = wei < 0n
  const absolute = negative ? -wei : wei
  const integer = (absolute / SCALE).toString()
  const fraction = (absolute % SCALE).toString().padStart(DECIMALS, '0').replace(/0+$/, '')
  return `${negative ? '-' : ''}${integer}${fraction ? `.${fraction}` : ''}`
}

export const addEth = (...values: string[]) => fromWei(values.reduce((sum, value) => sum + toWei(value), 0n))
export const mulEth = (value: string, factor: number) => fromWei(toWei(value) * BigInt(factor))
/** Percentual em pontos-base (1000 = 10%). */
export const percentOfEth = (value: string, basisPoints: number) =>
  fromWei((toWei(value) * BigInt(basisPoints)) / 10_000n)
export const compareEth = (a: string, b: string) => {
  const diff = toWei(a) - toWei(b)
  return diff === 0n ? 0 : diff < 0n ? -1 : 1
}
/** Casas decimais dos valores monetários do Figma (ex.: 0.016, 26.846). */
export const MONEY_DECIMALS = 3
/** Arredonda (meio para cima) para `decimals` casas; valores do servidor saem com no máximo 3. */
export const roundEth = (value: string, decimals = MONEY_DECIMALS) => {
  const step = 10n ** BigInt(DECIMALS - decimals)
  const wei = toWei(value)
  return fromWei(((wei + step / 2n) / step) * step)
}
export const minEth = (a: string, b: string) => (compareEth(a, b) <= 0 ? a : b)
export const subEth = (a: string, b: string) => fromWei(toWei(a) - toWei(b))
