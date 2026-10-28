import { WalletIcon } from 'lucide-react'
import type { ReactNode } from 'react'

import {
  hasReason,
  isApplicationError,
  isWalletProvider,
  walletProviderLabels,
  walletProviders,
  type CheckoutDraft,
  type Wallet,
  type WalletProvider,
  type WalletSlot,
} from '@application/dtos'

import { ChoiceGroup, type ChoiceOption } from '@presentation/components/checkout/choice-group'
import { networkLabels } from '@presentation/components/nft/network-labels'
import { Button } from '@presentation/components/ui/button'
import { useSetWalletConnection } from '@presentation/hooks/use-account'
import type { FormErrors } from '@presentation/hooks/use-checkout-flow'
import { shortenHash } from '@presentation/lib/format'

/** Ícone circular de cada provedor (Figma mobile: "W", "M" e ícone de carteira). */
const providerIcon: Record<WalletProvider, ReactNode> = {
  walletconnect: 'W',
  metamask: 'M',
  coinbase: <WalletIcon className="size-4" />,
}

const providerOptions: readonly ChoiceOption[] = walletProviders.map((provider) => ({
  value: provider,
  label: walletProviderLabels[provider],
  icon: (
    <span
      aria-hidden="true"
      className="flex size-8 shrink-0 items-center justify-center rounded-full bg-surface-raised text-body-sm font-bold text-text-accent"
    >
      {providerIcon[provider]}
    </span>
  ),
}))

const walletOption = (wallet: Wallet): ChoiceOption => ({
  value: wallet.slot,
  label: wallet.nickname,
  description: `${shortenHash(wallet.address)} · Rede ${networkLabels[wallet.network]}`,
})

type WalletSelectionProps = {
  readonly form: CheckoutDraft
  readonly wallets: readonly Wallet[]
  readonly errors: FormErrors
  readonly onSelectWallet: (wallet: Wallet) => void
  readonly onSelectProvider: (provider: WalletProvider) => void
  readonly disabled: boolean
}

const connectionMessage = (error: unknown) =>
  isApplicationError(error) && hasReason(error, 'WALLET_REJECTED')
    ? 'Conexão recusada na carteira. Tente conectar de novo.'
    : 'Não foi possível conectar a carteira. Tente de novo.'

/**
 * "Carteira e rede" (Figma): carteira cadastrada usada no pagamento e os
 * cartões de provedor, que são o "Tipo de carteira" e disparam a conexão
 * simulada (conectar, recusar, desconectar — R25). Com "Usar outra carteira?"
 * não há conexão: o provedor só identifica a carteira digitada.
 */
export function WalletSelection({
  form,
  wallets,
  errors,
  onSelectWallet,
  onSelectProvider,
  disabled,
}: WalletSelectionProps) {
  const connection = useSetWalletConnection()
  const { walletId, provider } = form.payment
  const selected = form.useOtherWallet ? null : (wallets.find((wallet) => wallet.slot === walletId) ?? null)
  const chosenProvider = isWalletProvider(provider) ? provider : null
  const connected = Boolean(selected?.connected && chosenProvider && selected.provider === chosenProvider)

  const connect = (slot: WalletSlot, next: WalletProvider) => {
    connection.reset()
    connection.mutate({ slot, connected: true, provider: next })
  }

  const providerError = errors['payment.provider']?.join(' ')

  return (
    <div className="flex flex-col gap-5">
      {wallets.length > 0 ? (
        <ChoiceGroup
          legend="Carteira conectada"
          columns="single"
          disabled={disabled}
          options={wallets.map(walletOption)}
          value={selected?.slot ?? null}
          onChange={(slot) => {
            const wallet = wallets.find((candidate) => candidate.slot === slot)
            if (wallet) onSelectWallet(wallet)
          }}
        />
      ) : null}

      <ChoiceGroup
        legend="Tipo de carteira"
        columns="single"
        disabled={disabled || connection.isPending}
        options={providerOptions}
        value={chosenProvider}
        error={providerError}
        onChange={(value) => {
          if (!isWalletProvider(value)) return
          onSelectProvider(value)
          if (selected) connect(selected.slot, value)
        }}
        onPick={(value) => {
          // Cartão já marcado mas desconectado (pré-preenchido ou após recusa): clicar conecta.
          if (value === chosenProvider && selected && !connected && !connection.isPending) {
            connect(selected.slot, value)
          }
        }}
      />

      <div role="status" aria-live="polite" className="text-body-sm">
        {connection.isPending ? <p className="text-text-secondary">Conectando carteira…</p> : null}
        {!connection.isPending && connected && selected?.provider ? (
          <p className="font-bold text-success">
            Carteira conectada via {walletProviderLabels[selected.provider]}
          </p>
        ) : null}
      </div>
      {connection.isError ? (
        <p role="alert" className="flex items-start gap-1 text-small text-destructive-foreground">
          <span aria-hidden="true" className="font-bold">
            !
          </span>
          {connectionMessage(connection.error)}
        </p>
      ) : null}

      {selected && chosenProvider && !disabled ? (
        connected ? (
          <Button
            variant="outline"
            size="sm"
            disabled={connection.isPending}
            onClick={() => {
              connection.reset()
              connection.mutate({ slot: selected.slot, connected: false })
            }}
            className="self-start"
          >
            Desconectar carteira
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            disabled={connection.isPending}
            onClick={() => {
              connect(selected.slot, chosenProvider)
            }}
            className="self-start"
          >
            Conectar carteira
          </Button>
        )
      ) : null}
    </div>
  )
}
