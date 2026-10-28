import { useId, useState } from 'react'

import { Button } from '@presentation/components/ui/button'
import { Slider } from '@presentation/components/ui/slider'
import { formatEthRange } from '@presentation/lib/format'

type PriceRangeFilterProps = {
  /** Limites do catálogo (facets.priceRange). */
  readonly boundsEth: { readonly minEth: string; readonly maxEth: string }
  /** Faixa aplicada na URL (ou os limites, se não houver). */
  readonly valueEth: { readonly min: string; readonly max: string }
  readonly onApply: (range: { readonly min: string; readonly max: string }) => void
}

const STEP = 0.01

/** O slider trabalha em número só para posicionar as alças; a URL recebe string com 2 casas. */
const toNumber = (eth: string) => Number(eth.replace(',', '.'))
const toEth = (value: number) => value.toFixed(2)

/** Faixa de preço do Figma: slider de duas alças, texto da faixa e "Aplicar". */
export function PriceRangeFilter({ boundsEth, valueEth, onApply }: PriceRangeFilterProps) {
  const titleId = useId()
  const min = toNumber(boundsEth.minEth)
  const max = toNumber(boundsEth.maxEth)
  const [range, setRange] = useState<[number, number]>([toNumber(valueEth.min), toNumber(valueEth.max)])

  return (
    <section role="group" aria-labelledby={titleId} className="flex flex-col gap-3">
      <h3 id={titleId} className="text-lead leading-4 font-bold text-foreground">
        Faixa de preço
      </h3>
      <div className="flex flex-col gap-3 pl-3">
        <Slider
          min={min}
          max={max}
          step={STEP}
          minStepsBetweenThumbs={1}
          value={range}
          onValueChange={(next) => {
            setRange([next[0] ?? min, next[1] ?? max])
          }}
          thumbLabels={['Preço mínimo', 'Preço máximo']}
          getValueText={(value) => `${toEth(value).replace('.', ',')} ETH`}
        />
        <p className="text-body text-foreground" aria-live="polite">
          Preço: {formatEthRange(toEth(range[0]), toEth(range[1]))}
        </p>
        <Button
          size="sm"
          className="w-23"
          onClick={() => {
            onApply({ min: toEth(range[0]), max: toEth(range[1]) })
          }}
        >
          Aplicar
        </Button>
      </div>
    </section>
  )
}
