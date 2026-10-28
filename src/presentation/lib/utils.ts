import { clsx, type ClassValue } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

/**
 * Escalas do design system (`globals.css`). Sem elas o tailwind-merge lê
 * `text-body-sm` como cor e descarta a cor do texto declarada antes (ex.: o
 * `text-primary-foreground` do botão), quebrando o contraste.
 */
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      text: [
        'display',
        'heading-xl',
        'heading-lg',
        'heading',
        'title',
        'lead',
        'lead-sm',
        'body-lg',
        'body',
        'body-sm',
        'caption',
        'small',
        'micro',
        'nano',
      ],
      radius: ['field', 'sheet'],
      shadow: ['field'],
      leading: ['compact', 'list'],
      spacing: ['control', 'search', 'icon-sm'],
      container: ['content', 'receipt', 'sidebar'],
    },
  },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
