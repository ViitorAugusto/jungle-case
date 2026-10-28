import { cloneElement, useState, type HTMLAttributes, type ReactElement } from 'react'

import { lazyWithRetry } from '@presentation/lib/lazy-with-retry'

type TriggerProps = HTMLAttributes<HTMLElement>

type DeferredAccountMenuProps = {
  /** Botão do gatilho (nome acessível "Menu da conta"); o mesmo elemento antes e depois de carregar. */
  readonly trigger: ReactElement<TriggerProps>
  readonly align?: 'start' | 'end'
  readonly side?: 'top' | 'bottom'
}

// Enquanto o chunk baixa, o próprio gatilho continua no lugar (sem mudança de layout).
const LazyAccountMenu = lazyWithRetry(() => import('@presentation/components/layout/account-menu'), {
  fallback: ({ trigger }) => trigger,
})

/**
 * Menu da conta sob demanda: o dropdown (Radix Menu, Popper) fica fora do
 * pacote inicial. O gatilho é o mesmo botão (sem mudança de layout); o
 * download começa no hover ou foco e o primeiro clique monta o menu já aberto.
 */
export function DeferredAccountMenu({ trigger, align, side }: DeferredAccountMenuProps) {
  const [activated, setActivated] = useState(false)
  const placement = { ...(align ? { align } : {}), ...(side ? { side } : {}) }
  if (activated) return <LazyAccountMenu.Component trigger={trigger} defaultOpen {...placement} />

  return cloneElement(trigger, {
    'aria-haspopup': 'menu',
    'aria-expanded': false,
    onPointerEnter: LazyAccountMenu.preload,
    onFocus: LazyAccountMenu.preload,
    onClick: () => {
      LazyAccountMenu.preload()
      setActivated(true)
    },
  })
}
