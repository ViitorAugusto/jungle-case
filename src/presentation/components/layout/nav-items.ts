/**
 * Navegação principal do Figma. Criadores e Aprenda estão fora do escopo
 * (premissa 15): aparecem desabilitados, com "Em breve", sem simular sucesso.
 */
export type NavItem =
  | { readonly label: string; readonly kind: 'home' }
  | { readonly label: string; readonly kind: 'market' }
  | { readonly label: string; readonly kind: 'soon' }

export const mainNavItems: readonly NavItem[] = [
  { label: 'Início', kind: 'home' },
  { label: 'Mercado', kind: 'market' },
  { label: 'Criadores', kind: 'soon' },
  { label: 'Aprenda', kind: 'soon' },
]

/** Âncora do catálogo no Início (destino de "Mercado" e da busca). */
export const CATALOG_ANCHOR = 'catalogo'
