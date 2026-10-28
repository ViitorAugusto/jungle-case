/** Identificador do carrinho de visitante guardado no navegador. */
export interface GuestCartStorage {
  load(): string | null
  getOrCreate(): string
  clear(): void
}
