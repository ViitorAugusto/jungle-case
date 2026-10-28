/**
 * Serialização dos search params em formato de URL comum, em vez do JSON
 * padrão do TanStack Router: listas repetem a chave (`network=ethereum&network=solana`)
 * e valores ficam em texto (`min=0.5`, `page=2`). Cada rota normaliza tipos no
 * próprio `validateSearch`.
 */
export const parseSearch = (searchStr: string): Record<string, unknown> => {
  const params = new URLSearchParams(searchStr.startsWith('?') ? searchStr.slice(1) : searchStr)
  const result: Record<string, string | string[]> = {}
  for (const key of new Set(params.keys())) {
    const values = params.getAll(key)
    result[key] = values.length > 1 ? values : (values[0] ?? '')
  }
  return result
}

const toText = (value: unknown): string | null => {
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  return null
}

export const stringifySearch = (search: Record<string, unknown>): string => {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(search)) {
    const values: unknown[] = Array.isArray(value) ? value : [value]
    for (const item of values) {
      const text = toText(item)
      if (text !== null && text !== '') params.append(key, text)
    }
  }
  const query = params.toString()
  return query ? `?${query}` : ''
}
