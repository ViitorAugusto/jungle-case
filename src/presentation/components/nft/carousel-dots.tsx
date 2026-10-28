import { cn } from '@presentation/lib/utils'

type CarouselDotsProps = {
  readonly count: number
  readonly active: number
  readonly onSelect: (index: number) => void
  /** Nome do grupo (ex.: "Páginas de Mais desta coleção"). */
  readonly label: string
  /** id da lista que os pontos controlam. */
  readonly controls?: string
  readonly className?: string
}

/**
 * Pontos de carrossel do Figma (○●○): círculos de 10 px com contorno Primary,
 * o ativo preenchido. Cada ponto fica num alvo de toque de 24 px (WCAG 2.5.8);
 * a margem negativa mantém o ponto na posição do frame.
 */
export function CarouselDots({ count, active, onSelect, label, controls, className }: CarouselDotsProps) {
  if (count < 2) return null
  return (
    <div role="group" aria-label={label} className={cn('-my-2 flex', className)}>
      {Array.from({ length: count }, (_, index) => (
        <button
          key={index}
          type="button"
          aria-label={`Página ${String(index + 1)} de ${String(count)}`}
          aria-pressed={index === active}
          {...(controls ? { 'aria-controls': controls } : {})}
          onClick={() => {
            onSelect(index)
          }}
          className="group flex size-6 cursor-pointer items-center justify-center rounded-full focus-ring"
        >
          <span
            aria-hidden="true"
            className={cn(
              'size-2.5 rounded-full border border-primary',
              index === active ? 'bg-primary' : 'group-hover:bg-primary/40',
            )}
          />
        </button>
      ))}
    </div>
  )
}
