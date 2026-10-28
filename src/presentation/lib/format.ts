/*
 * Valores ETH vindos da API são exibidos pelo componente `EthValue` sem
 * formatação (premissa 16). Aqui ficam só formatos de controles da interface.
 */

/**
 * Posição das alças do filtro de preço, no formato do Figma: "0,02 - 12,30 ETH".
 * São valores do controle (passo de 0,01), não preços vindos da API.
 */
export const formatEthRange = (min: string, max: string): string =>
  `${min.replace('.', ',')} - ${max.replace('.', ',')} ETH`

/** "1 resultado" / "48 resultados". */
export const pluralize = (count: number, singular: string, plural: string): string =>
  `${count} ${count === 1 ? singular : plural}`

/** Hash ou endereço longo no formato do Figma: "0xA91F…E82C". */
export const shortenHash = (value: string): string =>
  value.length > 12 ? `${value.slice(0, 6)}…${value.slice(-4)}` : value

const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'] as const

/** Data do recibo no formato do Figma: "29 Jul, 2026" (fuso local). */
export const formatReceiptDate = (iso: string): string => {
  const date = new Date(iso)
  return `${date.getDate()} ${MONTHS[date.getMonth()] ?? ''}, ${date.getFullYear()}`
}
