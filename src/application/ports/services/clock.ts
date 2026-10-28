/** Fonte de tempo injetável, para que regras e testes não dependam do relógio real. */
export interface Clock {
  now(): Date
}
