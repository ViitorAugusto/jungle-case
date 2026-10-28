import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import type {
  AvatarInput,
  PasswordChangeInput,
  Profile,
  ProfileInput,
  SetWalletConnectionInput,
  Wallet,
  WalletInput,
  WalletSlot,
} from '@application/dtos'

import { container } from '@main/container'
import { queryKeys } from '@main/query/query-keys'
import { useCurrentUserId } from '@presentation/hooks/use-session'

const { profile, wallets } = container

export const useProfile = () => {
  const userId = useCurrentUserId()
  return useQuery({
    queryKey: userId ? queryKeys.profile(userId) : queryKeys.inactive('profile'),
    queryFn: ({ signal }) => profile.get.execute({ signal }),
    enabled: userId !== null,
  })
}

const useProfileMutation = <TInput>(mutationFn: (input: TInput) => Promise<Profile>) => {
  const queryClient = useQueryClient()
  const userId = useCurrentUserId()
  return useMutation({
    mutationFn,
    onSuccess: (next) => {
      if (userId) queryClient.setQueryData(queryKeys.profile(userId), next)
    },
  })
}

/**
 * Salva o "Perfil do colecionador". Erros de campo em `error.fieldErrors`
 * (validação local ou 422 da API); e-mail ou nome de usuário em uso = 409
 * com `fieldErrors.email` / `fieldErrors.username`.
 */
export const useUpdateProfile = () =>
  useProfileMutation((input: ProfileInput) => profile.update.execute(input))

export const useUpdateAvatar = () =>
  useProfileMutation((input: AvatarInput) => profile.updateAvatar.execute(input))

/** "Remover" do avatar: o perfil volta sem foto. */
export const useRemoveAvatar = () => useProfileMutation(() => profile.removeAvatar.execute())

/** Senha atual errada: 422 com `fieldErrors.currentPassword`. */
export const useChangePassword = () =>
  useMutation({ mutationFn: (input: PasswordChangeInput) => profile.changePassword.execute(input) })

export const useWallets = () => {
  const userId = useCurrentUserId()
  return useQuery({
    queryKey: userId ? queryKeys.wallets(userId) : queryKeys.inactive('wallets'),
    queryFn: ({ signal }) => wallets.list.execute({ signal }),
    enabled: userId !== null,
  })
}

const useWalletsMutation = <TInput, TResult>(mutationFn: (input: TInput) => Promise<TResult>) => {
  const queryClient = useQueryClient()
  const userId = useCurrentUserId()
  return useMutation({
    mutationFn,
    onSettled: () => {
      if (userId) void queryClient.invalidateQueries({ queryKey: queryKeys.wallets(userId) })
    },
  })
}

export const useSaveWallet = () =>
  useWalletsMutation<WalletInput, Wallet>((input) => wallets.save.execute(input))

export const useRemoveWallet = () => useWalletsMutation((slot: WalletSlot) => wallets.remove.execute(slot))

/**
 * Conexão simulada pelo provedor (`{ slot, connected: true, provider }`) ou
 * desconexão (`{ slot, connected: false }`). Recusa vem como `CONFLICT` com
 * `reason` `WALLET_REJECTED` (cenário `wallet-rejected`).
 */
export const useSetWalletConnection = () =>
  useWalletsMutation<SetWalletConnectionInput, Wallet>((input) => wallets.setConnection.execute(input))
