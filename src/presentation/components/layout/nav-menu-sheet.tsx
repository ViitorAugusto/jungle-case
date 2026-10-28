import type { RefObject } from 'react'

import { NavEntry } from '@presentation/components/layout/nav-entry'
import { mainNavItems, type NavItem } from '@presentation/components/layout/nav-items'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@presentation/components/ui/sheet'

type NavMenuSheetProps = {
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
  readonly isActive: (item: NavItem) => boolean
  /** Sem `SheetTrigger` (o drawer é lazy): o foco volta manualmente ao botão que abriu. */
  readonly returnFocusTo: RefObject<HTMLButtonElement | null>
}

/** Navegação principal em drawer (768–1023 px). Carregada sob demanda pelo cabeçalho. */
export default function NavMenuSheet({ open, onOpenChange, isActive, returnFocusTo }: NavMenuSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-72 p-6"
        onCloseAutoFocus={(event) => {
          event.preventDefault()
          returnFocusTo.current?.focus()
        }}
      >
        <SheetHeader className="p-0">
          <SheetTitle className="text-lead">Menu</SheetTitle>
          <SheetDescription className="sr-only">Navegação principal do marketplace</SheetDescription>
        </SheetHeader>
        <nav aria-label="Principal">
          <ul className="flex flex-col gap-6">
            {mainNavItems.map((item) => (
              <li key={item.label}>
                <NavEntry
                  item={item}
                  active={isActive(item)}
                  onNavigate={() => {
                    onOpenChange(false)
                  }}
                />
              </li>
            ))}
          </ul>
        </nav>
      </SheetContent>
    </Sheet>
  )
}
