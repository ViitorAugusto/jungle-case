import { DomainError } from '@domain/errors/domain-error'

const DECIMALS = 18
const SCALE = 10n ** BigInt(DECIMALS)
const DECIMAL_PATTERN = /^(-)?(\d+)(?:\.(\d{1,18}))?$/

export class InvalidEthAmountError extends DomainError {
  readonly code = 'INVALID_ETH_AMOUNT'

  readonly value: string

  constructor(value: string) {
    super(`Valor em ETH inválido: "${value}"`)
    this.value = value
  }
}

/**
 * Valor em ETH com precisão de 18 casas (wei). Entra e sai como string decimal;
 * internamente usa `bigint`, então nenhuma conta passa por ponto flutuante.
 */
export class EthAmount {
  readonly wei: bigint

  private constructor(wei: bigint) {
    this.wei = wei
  }

  static of(value: string): EthAmount {
    const match = DECIMAL_PATTERN.exec(value.trim())
    if (!match) throw new InvalidEthAmountError(value)
    const [, sign, integer = '0', fraction = ''] = match
    const wei = BigInt(integer) * SCALE + BigInt(fraction.padEnd(DECIMALS, '0'))
    return new EthAmount(sign ? -wei : wei)
  }

  static isValid(value: string): boolean {
    return DECIMAL_PATTERN.test(value.trim())
  }

  static zero(): EthAmount {
    return new EthAmount(0n)
  }

  static sum(values: readonly EthAmount[]): EthAmount {
    return values.reduce((total, value) => total.plus(value), EthAmount.zero())
  }

  plus(other: EthAmount): EthAmount {
    return new EthAmount(this.wei + other.wei)
  }

  minus(other: EthAmount): EthAmount {
    return new EthAmount(this.wei - other.wei)
  }

  /** Multiplica por um inteiro (ex.: quantidade). */
  times(factor: number): EthAmount {
    if (!Number.isSafeInteger(factor)) throw new InvalidEthAmountError(String(factor))
    return new EthAmount(this.wei * BigInt(factor))
  }

  /** Percentual em pontos-base (1000 = 10%), arredondado para baixo no wei. */
  percentage(basisPoints: number): EthAmount {
    if (!Number.isSafeInteger(basisPoints)) throw new InvalidEthAmountError(String(basisPoints))
    return new EthAmount((this.wei * BigInt(basisPoints)) / 10_000n)
  }

  compare(other: EthAmount): -1 | 0 | 1 {
    if (this.wei === other.wei) return 0
    return this.wei < other.wei ? -1 : 1
  }

  equals(other: EthAmount): boolean {
    return this.wei === other.wei
  }

  isZero(): boolean {
    return this.wei === 0n
  }

  isNegative(): boolean {
    return this.wei < 0n
  }

  /** Forma canônica: sem zeros à direita na fração (ex.: "1.5", "0.0001", "2"). */
  toString(): string {
    const negative = this.wei < 0n
    const absolute = negative ? -this.wei : this.wei
    const integer = (absolute / SCALE).toString()
    const fraction = (absolute % SCALE).toString().padStart(DECIMALS, '0').replace(/0+$/, '')
    return `${negative ? '-' : ''}${integer}${fraction ? `.${fraction}` : ''}`
  }
}
