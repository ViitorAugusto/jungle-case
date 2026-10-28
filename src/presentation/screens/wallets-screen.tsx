import { useId, useState, type ReactNode } from 'react'

import {
  copyPrimaryWalletProfile,
  emptyWalletDraft,
  toWalletDraft,
  type Profile,
  type WalletDraft,
  type WalletSlot,
} from '@application/dtos'

import { StatePanel } from '@presentation/components/feedback/state-panel'
import { AccountLayout } from '@presentation/components/profile/account-layout'
import { Button } from '@presentation/components/ui/button'
import { Checkbox } from '@presentation/components/ui/checkbox'
import { Skeleton } from '@presentation/components/ui/skeleton'
import { COLLECTOR_FIELDS } from '@presentation/components/wallet/wallet-fields'
import { WalletForm } from '@presentation/components/wallet/wallet-form'
import { useProfile, useRemoveWallet, useWallets } from '@presentation/hooks/use-account'
import { userMessageFor } from '@presentation/lib/errors'
import { notify } from '@presentation/lib/notify'

const SLOT_TITLES: Record<WalletSlot, string> = {
  primary: 'Carteira principal',
  secondary: 'Carteira secundária',
}

/** Carteira nova começa com os dados do perfil (nome, e-mail, ENS e apelido). */
const blankFrom = (profile: Profile | undefined): WalletDraft => ({
  ...emptyWalletDraft(),
  nickname: profile?.walletNickname ?? '',
  displayName: profile?.displayName ?? '',
  profileName: profile?.displayName ?? '',
  email: profile?.email ?? '',
  ensName: profile?.ensName ?? '',
})

type WalletSectionProps = {
  readonly slot: WalletSlot
  readonly description?: string
  readonly headerExtra?: ReactNode
  readonly addLabel: string
  /** Formulário aberto (carteira existente ou "Adicionar" clicado). */
  readonly open: boolean
  readonly onAdd: () => void
  readonly emptyText?: string
  readonly children: ReactNode
}

/** Seção de uma carteira: título do Figma, "Adicionar" à direita quando vazia. */
function WalletSection({
  slot,
  description,
  headerExtra,
  addLabel,
  open,
  onAdd,
  emptyText,
  children,
}: WalletSectionProps) {
  const titleId = useId()
  return (
    <section aria-labelledby={titleId} className="flex flex-col gap-5 rounded-lg bg-surface-card p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 id={titleId} className="text-title font-bold text-foreground">
          {SLOT_TITLES[slot]}
        </h2>
        {open ? null : (
          <Button variant="link" aria-label={addLabel} onClick={onAdd} className="px-0">
            Adicionar
          </Button>
        )}
      </div>
      {description ? <p className="text-body-sm text-text-secondary">{description}</p> : null}
      {headerExtra}
      {open ? children : emptyText ? <p className="text-body-sm text-text-secondary">{emptyText}</p> : null}
    </section>
  )
}

function WalletsSkeleton() {
  return (
    <div aria-busy="true" aria-label="Carregando carteiras" className="flex flex-col gap-6">
      <Skeleton className="h-150 rounded-lg" />
      <Skeleton className="h-32 rounded-lg" />
    </div>
  )
}

/**
 * Carteiras (Figma): principal com o formulário do Pagamento e secundária
 * opcional, que pode copiar os dados de colecionador da principal ("Igual à
 * carteira principal"); endereço e rede de cada uma são próprios.
 */
export function WalletsScreen() {
  const wallets = useWallets()
  const profile = useProfile()
  const remove = useRemoveWallet()
  const sameAsPrimaryId = useId()
  const [adding, setAdding] = useState<Record<WalletSlot, boolean>>({ primary: false, secondary: false })
  const [sameAsPrimary, setSameAsPrimary] = useState(false)
  const [feedback, setFeedback] = useState('')

  const announce = (message: string) => {
    setFeedback('')
    requestAnimationFrame(() => {
      setFeedback(message)
    })
  }

  const byslot = (slot: WalletSlot) => wallets.data?.find((wallet) => wallet.slot === slot) ?? null
  const primary = byslot('primary')
  const secondary = byslot('secondary')
  const copyPrimary =
    sameAsPrimary && primary ? (typed: WalletDraft) => copyPrimaryWalletProfile(typed, primary) : undefined

  const removeSecondary = () => {
    remove.mutate('secondary', {
      onSuccess: () => {
        setAdding((current) => ({ ...current, secondary: false }))
        setSameAsPrimary(false)
        announce('Carteira removida.')
      },
      onError: (error) => {
        const message = userMessageFor(error)
        if (message) notify.error(message)
      },
    })
  }

  const content =
    wallets.isError && !wallets.data ? (
      <StatePanel
        role="alert"
        title={<p className="text-lead font-bold text-foreground">Não foi possível carregar as carteiras.</p>}
        actions={<Button onClick={() => void wallets.refetch()}>Tentar novamente</Button>}
      />
    ) : !wallets.data || profile.isPending ? (
      <WalletsSkeleton />
    ) : (
      <>
        <WalletSection
          slot="primary"
          description="Estas carteiras ficam disponíveis no pagamento e para receber NFTs comprados."
          addLabel="Adicionar carteira principal"
          open={primary !== null || adding.primary}
          onAdd={() => {
            setAdding((current) => ({ ...current, primary: true }))
          }}
          emptyText="Você ainda não adicionou uma carteira principal."
        >
          <WalletForm
            key={primary?.updatedAt ?? 'nova-principal'}
            slot="primary"
            initial={primary ? toWalletDraft(primary) : blankFrom(profile.data)}
            onSaved={announce}
          />
        </WalletSection>

        <WalletSection
          slot="secondary"
          addLabel="Adicionar carteira secundária"
          open={secondary !== null || adding.secondary}
          onAdd={() => {
            setAdding((current) => ({ ...current, secondary: true }))
          }}
          emptyText="Você ainda não adicionou uma carteira secundária."
          headerExtra={
            primary ? (
              <div className="flex items-center gap-3">
                <Checkbox
                  id={sameAsPrimaryId}
                  checked={sameAsPrimary}
                  onCheckedChange={(checked) => {
                    setSameAsPrimary(checked === true)
                    if (checked === true) setAdding((current) => ({ ...current, secondary: true }))
                  }}
                  className="rounded-full"
                />
                <label htmlFor={sameAsPrimaryId} className="cursor-pointer text-body-sm text-foreground">
                  Igual à carteira principal
                </label>
              </div>
            ) : null
          }
        >
          <WalletForm
            key={secondary?.updatedAt ?? 'nova-secundaria'}
            slot="secondary"
            initial={secondary ? toWalletDraft(secondary) : blankFrom(profile.data)}
            derive={copyPrimary}
            lockedFields={copyPrimary ? COLLECTOR_FIELDS : []}
            onSaved={announce}
            extraActions={
              secondary ? (
                <Button type="button" variant="outline" disabled={remove.isPending} onClick={removeSecondary}>
                  Remover carteira
                </Button>
              ) : null
            }
          />
        </WalletSection>
      </>
    )

  return (
    <AccountLayout section="carteiras" title="Carteiras" hideTitle>
      <p role="status" aria-live="polite" className="text-body-sm font-bold text-success empty:hidden">
        {feedback}
      </p>
      {content}
    </AccountLayout>
  )
}
