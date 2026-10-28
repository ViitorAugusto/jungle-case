import { Link } from '@tanstack/react-router'
import { EllipsisVerticalIcon, WalletIcon } from 'lucide-react'
import { RadioGroup as RadioGroupPrimitive } from 'radix-ui'
import { useId, type ReactNode } from 'react'

import {
  hasReason,
  isApplicationError,
  isWalletProvider,
  walletProviderLabels,
  type CheckoutDraft,
  type Wallet,
  type WalletProvider,
  type WalletSlot,
} from '@application/dtos'

import { networkLabels } from '@presentation/components/nft/network-labels'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@presentation/components/ui/dropdown-menu'
import { shortenHash } from '@presentation/lib/format'
import { walletSlotLabels } from '@presentation/components/checkout/wallet-labels'
import { cn } from '@presentation/lib/utils'

/** Ordem e ícones do Figma: "W", "M" e carteira em círculo de 40 px (mobile). */
const providerOrder: readonly WalletProvider[] = ['walletconnect', 'metamask', 'coinbase']
const providerIcon: Record<WalletProvider, ReactNode> = {
  walletconnect: 'W',
  metamask: 'M',
  coinbase: <WalletIcon className="size-4" />,
}
/** Selo do Figma na primeira opção do desktop: o WalletConnect abre as três carteiras. */
const walletConnectBadge = ['METAMASK', 'WALLETCONNECT', 'COINBASE'] as const

const slotOrder: readonly WalletSlot[] = ['secondary', 'primary']

const networkLine = (wallet: Wallet) =>
  wallet.network === 'ethereum' ? 'Rede principal Ethereum' : `Rede ${networkLabels[wallet.network]}`

/** ENS da carteira (com ".eth") ou o endereço encurtado. */
const walletHandle = (wallet: Wallet) => {
  if (!wallet.ensName) return shortenHash(wallet.address)
  return wallet.ensName.endsWith('.eth') ? wallet.ensName : `${wallet.ensName}.eth`
}

/** Círculo do rádio do Figma: contorno laranja (ou marrom, se `muted`); marcado, ponto laranja. */
function RadioMark({ muted = false }: { readonly muted?: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'flex size-4 shrink-0 items-center justify-center rounded-full border-[1.5px] group-data-[state=checked]:border-primary',
        muted ? 'border-border-soft' : 'border-primary',
      )}
    >
      <span className="size-2 rounded-full bg-primary opacity-0 group-data-[state=checked]:opacity-100" />
    </span>
  )
}

const connectionMessage = (error: unknown) =>
  isApplicationError(error) && hasReason(error, 'WALLET_REJECTED')
    ? 'Conexão recusada na carteira. Tente conectar de novo.'
    : 'Não foi possível conectar a carteira. Tente de novo.'

type SavedWalletsProps = {
  readonly wallets: readonly Wallet[]
  readonly value: WalletSlot | null
  readonly onChange: (wallet: Wallet) => void
  readonly onDisconnect: (slot: WalletSlot) => void
  readonly disabled: boolean
  readonly className?: string
}

/**
 * "Carteira conectada" (Figma mobile): cards de 92 px das carteiras
 * cadastradas, com rádio, nome, ENS ou endereço, rede e o menu "⋮". O menu
 * fica fora do rádio, sem aninhar controles.
 */
export function SavedWallets({
  wallets,
  value,
  onChange,
  onDisconnect,
  disabled,
  className,
}: SavedWalletsProps) {
  const titleId = useId()
  const ordered = slotOrder.flatMap((slot) => wallets.filter((wallet) => wallet.slot === slot))

  return (
    <section aria-labelledby={titleId} className={cn('flex flex-col', className)}>
      <div className="flex items-center justify-between">
        <h2 id={titleId} className="text-body-lg font-bold text-foreground">
          Carteira conectada
        </h2>
        <Link
          to="/perfil/carteiras"
          className="rounded-xs text-body font-bold text-text-accent focus-ring hover:underline"
        >
          Trocar carteira
        </Link>
      </div>
      <RadioGroupPrimitive.Root
        aria-labelledby={titleId}
        value={value ?? ''}
        disabled={disabled}
        onValueChange={(slot) => {
          const wallet = wallets.find((candidate) => candidate.slot === slot)
          if (wallet) onChange(wallet)
        }}
        className="mt-3 flex flex-col gap-5"
      >
        {ordered.map((wallet) => (
          <div key={wallet.slot} className="relative">
            <RadioGroupPrimitive.Item
              value={wallet.slot}
              aria-label={`${walletSlotLabels[wallet.slot]}, ${walletHandle(wallet)}, ${networkLine(wallet)}`}
              className="group flex h-23 w-full cursor-pointer items-center gap-4.5 rounded-lg bg-surface-card pr-12 pl-4.75 text-left focus-ring disabled:cursor-not-allowed"
            >
              <RadioMark muted />
              <span className="flex min-w-0 flex-col">
                <span className="text-body font-bold text-foreground">{walletSlotLabels[wallet.slot]}</span>
                <span className="mt-1.5 truncate text-body-sm leading-4 text-subtle">
                  {walletHandle(wallet)}
                </span>
                <span className="mt-1.5 truncate text-body-sm leading-4 text-subtle">
                  {networkLine(wallet)}
                </span>
              </span>
            </RadioGroupPrimitive.Item>
            <DropdownMenu>
              <DropdownMenuTrigger
                aria-label={`Opções da carteira ${walletSlotLabels[wallet.slot]}`}
                className="absolute top-1/2 right-2 flex size-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-xs text-subtle focus-ring hover:text-foreground"
              >
                <EllipsisVerticalIcon aria-hidden="true" className="size-icon-sm" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link to="/perfil/carteiras">Editar carteira</Link>
                </DropdownMenuItem>
                {wallet.connected ? (
                  <DropdownMenuItem
                    onSelect={() => {
                      onDisconnect(wallet.slot)
                    }}
                  >
                    Desconectar carteira
                  </DropdownMenuItem>
                ) : null}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ))}
      </RadioGroupPrimitive.Root>
    </section>
  )
}

type ProviderPickerProps = {
  readonly form: CheckoutDraft
  readonly wallets: readonly Wallet[]
  readonly onSelectProvider: (provider: WalletProvider) => void
  readonly onDisconnect: (slot: WalletSlot) => void
  readonly connection: { readonly isPending: boolean; readonly isError: boolean; readonly error: unknown }
  readonly disabled: boolean
  readonly className?: string
}

/**
 * "Carteira e rede" (Figma): o provedor da carteira. Desktop: opções de 45 px
 * com o rádio à esquerda (a primeira é o selo METAMASK · WALLETCONNECT ·
 * COINBASE, do WalletConnect). Mobile: cards de 64 px com ícone e rádio à
 * direita. Escolher conecta a carteira cadastrada (simulação, R25); o estado
 * da conexão é anunciado em região viva.
 */
export function ProviderPicker({
  form,
  wallets,
  onSelectProvider,
  onDisconnect,
  connection,
  disabled,
  className,
}: ProviderPickerProps) {
  const titleId = useId()
  const { walletId, provider } = form.payment
  const selected = form.useOtherWallet ? null : (wallets.find((wallet) => wallet.slot === walletId) ?? null)
  const chosen = isWalletProvider(provider) ? provider : null
  const connected = Boolean(selected?.connected && chosen && selected.provider === chosen)

  return (
    <section aria-labelledby={titleId} className={cn('flex flex-col', className)}>
      <h2 id={titleId} className="text-body-lg font-bold text-foreground md:text-center">
        Carteira e rede
      </h2>
      <RadioGroupPrimitive.Root
        aria-labelledby={titleId}
        value={chosen ?? ''}
        disabled={disabled || connection.isPending}
        onValueChange={(value) => {
          if (isWalletProvider(value)) onSelectProvider(value)
        }}
        className="mt-2.5 flex flex-col gap-4.25 md:mt-4.25 md:gap-4"
      >
        {providerOrder.map((option) => (
          <RadioGroupPrimitive.Item
            key={option}
            value={option}
            className="group flex h-16 cursor-pointer items-center gap-2.75 rounded-lg bg-surface-card pr-4 pl-3.5 text-left focus-ring disabled:cursor-not-allowed md:h-11.25 md:rounded-xs md:border md:border-border md:bg-transparent md:px-3 md:data-[state=checked]:border-primary"
          >
            <span
              aria-hidden="true"
              className="flex size-10 shrink-0 items-center justify-center rounded-full border border-border bg-surface-raised text-body-sm font-bold text-text-accent md:hidden"
            >
              {providerIcon[option]}
            </span>
            <span className="max-md:hidden">
              <RadioMark />
            </span>
            {option === 'walletconnect' ? (
              <>
                <span className="text-body-sm text-foreground md:sr-only">WalletConnect</span>
                <span
                  aria-hidden="true"
                  className="hidden h-6.5 items-center gap-3 rounded-sm border border-border-soft bg-surface-dark px-2 text-micro font-bold tracking-wide text-text-accent md:flex"
                >
                  {walletConnectBadge.map((name, index) => (
                    <span key={name} className="flex items-center gap-3">
                      {index > 0 ? <span>•</span> : null}
                      {name}
                    </span>
                  ))}
                </span>
              </>
            ) : (
              <span className="text-body-sm text-foreground md:text-body">
                {walletProviderLabels[option]}
              </span>
            )}
            <span className="ml-auto md:hidden">
              <RadioMark muted />
            </span>
          </RadioGroupPrimitive.Item>
        ))}
      </RadioGroupPrimitive.Root>

      <div role="status" aria-live="polite" className="text-body-sm empty:hidden">
        {connection.isPending ? <p className="mt-3 text-text-secondary">Conectando carteira…</p> : null}
        {!connection.isPending && connected && selected?.provider ? (
          <p className="mt-3 flex items-center justify-between gap-3 text-foreground">
            <span>Carteira conectada via {walletProviderLabels[selected.provider]}</span>
            {disabled ? null : (
              <button
                type="button"
                onClick={() => {
                  onDisconnect(selected.slot)
                }}
                className="cursor-pointer rounded-xs text-text-accent focus-ring hover:underline"
              >
                Desconectar carteira
              </button>
            )}
          </p>
        ) : null}
      </div>
      {connection.isError ? (
        <p role="alert" className="mt-3 flex items-start gap-1 text-small text-destructive-foreground">
          <span aria-hidden="true" className="font-bold">
            !
          </span>
          {connectionMessage(connection.error)}
        </p>
      ) : null}
    </section>
  )
}
