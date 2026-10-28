/** Tiragem como no Figma: "1/50" ou "ABERTA" (edição sem limite, `supply` nulo). */
export const editionTagOf = (supply: number | null): string =>
  supply === null ? 'ABERTA' : `1/${String(supply)}`
