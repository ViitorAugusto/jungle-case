import { useId } from 'react'

import { ORDER_NOTE_MAX_LENGTH, type CheckoutDraft, type Wallet } from '@application/dtos'

import { FieldError } from '@presentation/components/form/field-error'
import { FieldLabel } from '@presentation/components/form/field-label'
import { EnsField } from '@presentation/components/form/ens-field'
import { FormField } from '@presentation/components/form/form-field'
import { SelectField } from '@presentation/components/form/select-field'
import { walletSlotLabels } from '@presentation/components/checkout/wallet-labels'
import { networkOptions } from '@presentation/components/nft/network-labels'
import { Checkbox } from '@presentation/components/ui/checkbox'
import { Textarea } from '@presentation/components/ui/textarea'
import type { FormErrors } from '@presentation/hooks/use-checkout-flow'

type Collector = CheckoutDraft['collector']
type Payment = CheckoutDraft['payment']

type CollectorFormProps = {
  readonly form: CheckoutDraft
  readonly errors: FormErrors
  readonly onChange: (next: CheckoutDraft, touched: readonly string[]) => void
  /** Endereço e rede vêm da carteira cadastrada escolhida: só leitura. */
  readonly walletLocked: boolean
  readonly onToggleOtherWallet: (checked: boolean) => void
  /** Carteiras cadastradas: o select "Tipo de carteira" escolhe qual paga (Principal ou Reserva). */
  readonly wallets: readonly Wallet[]
  readonly onSelectWallet: (wallet: Wallet) => void
  /** Revisão em andamento: formulário travado. */
  readonly disabled: boolean
}

/** Campo de deslocamento do rótulo, para o campo sem rótulo visível alinhar com o vizinho. */
const UNLABELED_OFFSET = 'md:pt-7.5'

/**
 * "Perfil do colecionador" (Figma Pagamento): duas colunas de 369 px na ordem
 * do frame (esquerda: exibição, Rede, Endereço, Tipo de carteira, E-mail;
 * direita: usuário, perfil, ENS opcional, Código de indicação, Nome ENS),
 * obrigatórios com "*" laranja e erros por campo vindos da validação local ou
 * da API (chaves `collector.*` e `payment.*`).
 */
export function CollectorForm({
  form,
  errors,
  onChange,
  walletLocked,
  onToggleOtherWallet,
  wallets,
  onSelectWallet,
  disabled,
}: CollectorFormProps) {
  const noteId = useId()
  const noteErrorId = `${noteId}-erro`
  const otherWalletId = useId()

  const setCollector = (field: keyof Collector, value: string) => {
    onChange({ ...form, collector: { ...form.collector, [field]: value } }, [`collector.${field}`])
  }
  const setPayment = (field: keyof Payment, value: string) => {
    onChange({ ...form, payment: { ...form.payment, [field]: value } }, [`payment.${field}`])
  }
  const errorsOf = (field: string) => errors[field]
  const noteErrors = errorsOf('collector.note')

  return (
    <fieldset disabled={disabled} className="flex min-w-0 flex-col" data-checkout-form>
      <legend className="text-body-lg leading-5 font-bold text-foreground">Perfil do colecionador</legend>

      <div className="mt-2.75 grid gap-x-6 gap-y-3.25 md:grid-cols-2">
        <FormField
          label="Nome de exibição"
          markRequired
          aria-required="true"
          autoComplete="name"
          value={form.collector.displayName}
          errors={errorsOf('collector.displayName')}
          onChange={(event) => {
            setCollector('displayName', event.target.value)
          }}
        />
        <FormField
          label="Nome de usuário"
          markRequired
          aria-required="true"
          autoComplete="username"
          autoCapitalize="none"
          value={form.collector.username}
          errors={errorsOf('collector.username')}
          onChange={(event) => {
            setCollector('username', event.target.value)
          }}
        />

        <SelectField
          label="Rede"
          markRequired
          placeholder="Selecione uma rede"
          options={networkOptions}
          value={form.payment.network}
          errors={errorsOf('payment.network')}
          disabled={disabled || walletLocked}
          onChange={(value) => {
            setPayment('network', value)
          }}
        />
        <FormField
          label="Nome do perfil"
          markRequired
          aria-required="true"
          value={form.collector.profileName}
          errors={errorsOf('collector.profileName')}
          onChange={(event) => {
            setCollector('profileName', event.target.value)
          }}
        />

        <FormField
          label="Endereço da carteira"
          markRequired
          aria-required="true"
          placeholder="Endereço 0x da carteira"
          autoComplete="off"
          spellCheck={false}
          readOnly={walletLocked}
          value={form.payment.address}
          errors={errorsOf('payment.address')}
          onChange={(event) => {
            setPayment('address', event.target.value)
          }}
          className="[&_input:read-only]:text-text-secondary"
        />
        <FormField
          label="ENS ou carteira secundária (opcional)"
          hideLabel
          placeholder="ENS ou carteira secundária (opcional)"
          autoComplete="off"
          spellCheck={false}
          value={form.payment.secondaryAddressOrEns}
          errors={errorsOf('payment.secondaryAddressOrEns')}
          onChange={(event) => {
            setPayment('secondaryAddressOrEns', event.target.value)
          }}
          className={UNLABELED_OFFSET}
        />

        <SelectField
          label="Tipo de carteira"
          markRequired
          placeholder="Selecione uma carteira"
          options={wallets.map((wallet) => ({
            value: wallet.slot,
            label: `${walletSlotLabels[wallet.slot]} · ${wallet.nickname}`,
          }))}
          value={form.useOtherWallet ? '' : (form.payment.walletId ?? '')}
          disabled={disabled || form.useOtherWallet || wallets.length === 0}
          onChange={(slot) => {
            const wallet = wallets.find((candidate) => candidate.slot === slot)
            if (wallet) onSelectWallet(wallet)
          }}
        />
        <FormField
          label="Código de indicação"
          markRequired
          aria-required="true"
          placeholder="JNG-2026"
          autoCapitalize="characters"
          value={form.collector.referralCode}
          errors={errorsOf('collector.referralCode')}
          onChange={(event) => {
            setCollector('referralCode', event.target.value)
          }}
        />

        <FormField
          label="E-mail"
          markRequired
          aria-required="true"
          type="email"
          autoComplete="email"
          value={form.collector.email}
          errors={errorsOf('collector.email')}
          onChange={(event) => {
            setCollector('email', event.target.value)
          }}
        />
        <EnsField
          markRequired
          aria-required="true"
          value={form.collector.ensName}
          errors={errorsOf('collector.ensName')}
          onValueChange={(value) => {
            setCollector('ensName', value)
          }}
        />
      </div>

      {/* Figma: círculo vazado laranja de 14 px; marcado, preenchido. */}
      <div className="mt-6 flex items-center gap-2.25">
        <Checkbox
          id={otherWalletId}
          checked={form.useOtherWallet}
          onCheckedChange={(checked) => {
            onToggleOtherWallet(checked === true)
          }}
          className="size-3.5 rounded-full border-2 border-primary bg-transparent [&_svg]:hidden"
        />
        <label htmlFor={otherWalletId} className="cursor-pointer text-body-lg leading-5 text-foreground">
          Usar outra carteira?
        </label>
      </div>

      <div className="mt-5.25 flex flex-col gap-2.5 md:w-87.5">
        <FieldLabel htmlFor={noteId} label="Observação do colecionador (opcional)" />
        <Textarea
          id={noteId}
          maxLength={ORDER_NOTE_MAX_LENGTH}
          aria-invalid={noteErrors ? true : undefined}
          {...(noteErrors ? { 'aria-describedby': noteErrorId } : {})}
          value={form.collector.note}
          onChange={(event) => {
            setCollector('note', event.target.value)
          }}
          className="h-38 resize-none rounded-xs border-border bg-transparent"
        />
        {noteErrors ? <FieldError id={noteErrorId} errors={noteErrors} /> : null}
      </div>
    </fieldset>
  )
}
