import { useId } from 'react'

import { ORDER_NOTE_MAX_LENGTH, type CheckoutDraft } from '@application/dtos'

import { FieldError } from '@presentation/components/form/field-error'
import { FieldLabel } from '@presentation/components/form/field-label'
import { EnsField } from '@presentation/components/form/ens-field'
import { FormField } from '@presentation/components/form/form-field'
import { SelectField } from '@presentation/components/form/select-field'
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
  /** Revisão em andamento: formulário travado. */
  readonly disabled: boolean
}

/** Campo de deslocamento do rótulo, para o campo sem rótulo visível alinhar com o vizinho. */
const UNLABELED_OFFSET = 'md:pt-7.5'

/**
 * "Perfil do colecionador" (Figma Pagamento): dois campos por linha no
 * desktop, obrigatórios com "*" laranja, erros por campo vindos da validação
 * local ou da API (chaves `collector.*` e `payment.*`).
 */
export function CollectorForm({
  form,
  errors,
  onChange,
  walletLocked,
  onToggleOtherWallet,
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
    <fieldset disabled={disabled} className="flex min-w-0 flex-col gap-6" data-checkout-form>
      <legend className="mb-6 text-heading font-bold text-foreground">Perfil do colecionador</legend>

      <div className="grid gap-x-6 gap-y-5 md:grid-cols-2">
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

      <div className="flex items-center gap-3">
        <Checkbox
          id={otherWalletId}
          checked={form.useOtherWallet}
          onCheckedChange={(checked) => {
            onToggleOtherWallet(checked === true)
          }}
          className="rounded-full"
        />
        <label htmlFor={otherWalletId} className="cursor-pointer text-body-sm text-foreground">
          Usar outra carteira?
        </label>
      </div>

      <div className="flex flex-col gap-2">
        <FieldLabel htmlFor={noteId} label="Observação do colecionador (opcional)" hidden />
        <Textarea
          id={noteId}
          placeholder="Observação do colecionador (opcional)"
          maxLength={ORDER_NOTE_MAX_LENGTH}
          aria-invalid={noteErrors ? true : undefined}
          {...(noteErrors ? { 'aria-describedby': noteErrorId } : {})}
          value={form.collector.note}
          onChange={(event) => {
            setCollector('note', event.target.value)
          }}
          className="min-h-32"
        />
        {noteErrors ? <FieldError id={noteErrorId} errors={noteErrors} /> : null}
      </div>
    </fieldset>
  )
}
