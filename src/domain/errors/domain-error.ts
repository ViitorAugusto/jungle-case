/**
 * Base de toda violação de regra de negócio. Subclasses definem um `code`
 * estável que a interface traduz para mensagem amigável.
 */
export abstract class DomainError extends Error {
  abstract readonly code: string

  constructor(message: string) {
    super(message)
    this.name = new.target.name
  }
}
