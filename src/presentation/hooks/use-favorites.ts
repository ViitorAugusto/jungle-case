import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import type { Favorite, Nft } from '@application/dtos'

import { container } from '@main/container'
import { queryKeys } from '@main/query/query-keys'
import { useCurrentUserId } from '@presentation/hooks/use-session'

const { favorites } = container

/** Favoritos do usuário autenticado (desligado para visitante). */
export const useFavorites = () => {
  const userId = useCurrentUserId()
  return useQuery({
    queryKey: userId ? queryKeys.favorites(userId) : queryKeys.inactive('favorites'),
    queryFn: ({ signal }) => favorites.list.execute({ signal }),
    enabled: userId !== null,
  })
}

export const useIsFavorite = (nftId: string): boolean => {
  const { data } = useFavorites()
  return data?.some((favorite) => favorite.nftId === nftId) ?? false
}

export type ToggleFavoriteInput = {
  readonly nft: Nft
  readonly favorite: boolean
}

/**
 * Atualização otimista com rollback: a lista muda na hora; se a API falhar,
 * volta ao estado anterior e a falha fica em `error` para a interface avisar.
 * Visitante recebe `UNAUTHENTICATED` (a interface leva ao login).
 */
export const useToggleFavorite = () => {
  const queryClient = useQueryClient()
  const userId = useCurrentUserId()
  const key = userId ? queryKeys.favorites(userId) : queryKeys.inactive('favorites')

  return useMutation({
    mutationFn: ({ nft, favorite }: ToggleFavoriteInput) =>
      favorites.set.execute({ nftId: nft.id, favorite }),
    onMutate: async ({ nft, favorite }) => {
      if (!userId) return { previous: undefined }
      await queryClient.cancelQueries({ queryKey: key })
      const previous = queryClient.getQueryData<readonly Favorite[]>(key)
      const others = (previous ?? []).filter((item) => item.nftId !== nft.id)
      queryClient.setQueryData<readonly Favorite[]>(
        key,
        favorite
          ? [{ nftId: nft.id, createdAt: container.clock.now().toISOString(), nft }, ...others]
          : others,
      )
      return { previous }
    },
    onError: (_error, _input, context) => {
      if (userId && context) queryClient.setQueryData(key, context.previous)
    },
    onSettled: () => {
      if (userId) void queryClient.invalidateQueries({ queryKey: key })
    },
  })
}
