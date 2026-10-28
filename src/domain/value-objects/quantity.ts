import { DomainError } from '@domain/errors/domain-error'

export class InvalidQuantityError extends DomainError {
  readonly code = 'INVALID_QUANTITY'

  readonly value: number

  constructor(value: number) {
    super('A quantidade deve ser um número inteiro maior que zero')
    this.value = value
  }
}

export class QuantityExceedsAvailabilityError extends DomainError {
  readonly code = 'QUANTITY_EXCEEDS_AVAILABILITY'

  readonly requested: number
  readonly available: number

  constructor(requested: number, available: number) {
    super(
      available === 0
        ? 'Esta edição está esgotada'
        : `Quantidade indisponível: restam ${available} unidade(s) desta edição`,
    )
    this.requested = requested
    this.available = available
  }
}

/** Quantidade inteira e positiva de itens de uma edição. */
export class Quantity {
  readonly value: number

  private constructor(value: number) {
    this.value = value
  }

  static of(value: number): Quantity {
    if (!Number.isSafeInteger(value) || value < 1) throw new InvalidQuantityError(value)
    return new Quantity(value)
  }

  /** Valida a quantidade contra o estoque disponível da edição. */
  static within(value: number, available: number): Quantity {
    const quantity = Quantity.of(value)
    if (quantity.value > available) throw new QuantityExceedsAvailabilityError(value, available)
    return quantity
  }
}
