import * as React from 'react'
import { cn } from '@presentation/lib/utils'
import { Slider as SliderPrimitive } from 'radix-ui'

type SliderProps = React.ComponentProps<typeof SliderPrimitive.Root> & {
  /** Nome acessível de cada alça, na ordem dos valores (ex.: "Preço mínimo", "Preço máximo"). */
  readonly thumbLabels?: readonly string[]
  /** Texto lido pelo leitor de tela para o valor de cada alça. */
  readonly getValueText?: (value: number) => string
}

function Slider({
  className,
  defaultValue,
  value,
  min = 0,
  max = 100,
  thumbLabels,
  getValueText,
  ...props
}: SliderProps) {
  const values = Array.isArray(value) ? value : Array.isArray(defaultValue) ? defaultValue : [min, max]

  return (
    <SliderPrimitive.Root
      data-slot="slider"
      defaultValue={defaultValue}
      value={value}
      min={min}
      max={max}
      className={cn(
        'relative flex h-5 w-full touch-none items-center select-none data-[disabled]:opacity-50',
        className,
      )}
      {...props}
    >
      <SliderPrimitive.Track
        data-slot="slider-track"
        className="relative h-0.75 w-full grow rounded-full bg-primary"
      >
        <SliderPrimitive.Range data-slot="slider-range" className="absolute h-full rounded-full bg-primary" />
      </SliderPrimitive.Track>
      {values.map((thumbValue, index) => (
        <SliderPrimitive.Thumb
          data-slot="slider-thumb"
          key={index}
          aria-label={thumbLabels?.[index]}
          aria-valuetext={getValueText?.(thumbValue)}
          className="block size-4.5 shrink-0 cursor-grab rounded-full border-2 border-ink bg-primary transition-shadow outline-none hover:ring-4 hover:ring-primary/30 focus-visible:ring-4 focus-visible:ring-ring disabled:pointer-events-none"
        />
      ))}
    </SliderPrimitive.Root>
  )
}

export { Slider }
