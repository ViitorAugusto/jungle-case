import { useRouter, useRouterState } from '@tanstack/react-router'
import { HeartIcon } from 'lucide-react'
import { notify } from '@presentation/lib/notify'

import type { Nft } from '@application/dtos'

import { Button } from '@presentation/components/ui/button'
import { useIsFavorite, useToggleFavorite } from '@presentation/hooks/use-favorites'
import { useSession } from '@presentation/hooks/use-session'
import { isUnauthenticated, userMessageFor } from '@presentation/lib/errors'
import { loginHref } from '@presentation/navigation/require-auth'
import { cn } from '@presentation/lib/utils'

type FavoriteButtonProps = {
  readonly nft: Nft
  readonly className?: string
  readonly iconClassName?: string
  /** Versão do detalhe desktop: contorno primário com o texto "Favoritar". */
  readonly labeled?: boolean
}

/**
 * Favoritar com atualização otimista (rollback no hook). Visitante vai ao
 * login e volta para a página atual. Estado exposto por `aria-pressed` e pelo
 * preenchimento do ícone, não só pela cor.
 */
export function FavoriteButton({ nft, className, iconClassName, labeled = false }: FavoriteButtonProps) {
  const { isAuthenticated } = useSession()
  const isFavorite = useIsFavorite(nft.id)
  const toggle = useToggleFavorite()
  const href = useRouterState({ select: (state) => state.location.href })
  const router = useRouter()

  const goToLogin = () => {
    void router.navigate({ href: loginHref(href, false) })
  }

  const onClick = () => {
    if (!isAuthenticated) {
      goToLogin()
      return
    }
    const favorite = !isFavorite
    toggle.mutate(
      { nft, favorite },
      {
        onSuccess: () => {
          notify.success(
            favorite ? `${nft.name} adicionado aos favoritos.` : `${nft.name} removido dos favoritos.`,
          )
        },
        onError: (error) => {
          if (isUnauthenticated(error)) {
            goToLogin()
            return
          }
          const detail = userMessageFor(error)
          if (detail === null) return
          // Rollback já feito pelo hook; o aviso diz qual ação falhou e o motivo da API.
          const action = favorite ? 'favoritar' : 'remover dos favoritos'
          notify.error(`Não foi possível ${action} ${nft.name}. ${detail}`)
        },
      },
    )
  }

  const title = isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'
  const icon = (
    <HeartIcon
      aria-hidden="true"
      className={cn(labeled ? 'size-5' : 'size-icon-sm', isFavorite && 'fill-current', iconClassName)}
    />
  )

  if (labeled) {
    return (
      <Button
        variant="outline"
        aria-pressed={isFavorite}
        title={title}
        onClick={onClick}
        className={cn(
          'w-32.5 border-primary px-0 text-body-sm font-medium text-text-accent aria-pressed:bg-primary/15',
          className,
        )}
      >
        {icon}
        Favoritar
      </Button>
    )
  }

  return (
    <Button
      variant="icon-round"
      aria-pressed={isFavorite}
      aria-label="Favoritar"
      title={title}
      onClick={onClick}
      className={cn('relative z-10 text-text-accent', className)}
    >
      {icon}
    </Button>
  )
}
