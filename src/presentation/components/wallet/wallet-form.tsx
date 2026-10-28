import { useRef, useState, type ChangeEvent, type SyntheticEvent, type ReactNode } from 'react'

import {
  validateWalletDraft,
  walletProviderLabels,
  walletProviders,
  type WalletDraft,
  type WalletInput,
  type WalletSlot,
} from '@application/dtos'

import { EnsField } from '@presentation/components/form/ens-field'
import { FormField } from '@presentation/components/form/form-field'
import { SelectField } from '@presentation/components/form/select-field'
import { networkOptions } from '@presentation/components/nft/network-labels'
import { Button } from '@presentation/components/ui/button'
import { useSaveWallet } from '@presentation/hooks/use-account'
import { userMessageFor } from '@presentation/lib/errors'
import { fieldErrorsOf, focusFirstInvalid, type FieldMessages } from '@presentation/lib/form-errors'
import { notify } from '@presentation/lib/notify'

const providerOptions = walletProviders.map((provider) => ({
  value: provider,
  label: walletProviderLabels[provider],
}))

type WalletFormProps = {
  readonly slot: WalletSlot
  readonly initial: WalletDraft
  /** Campos travados por "Igual à carteira principal". */
  readonly lockedFields?: readonly (keyof WalletDraft)[]
  /** Ajuste aplicado sobre o que foi digitado (ex.: cópia dos dados da principal). */
  readonly derive?: ((typed: WalletDraft) => WalletDraft) | undefined
  readonly onSaved: (message: string) => void
  readonly extraActions?: ReactNode
}

/** Desloca o campo sem rótulo visível para alinhar com o vizinho rotulado. */
const UNLABELED_OFFSET = 'md:pt-7.5'

/**
 * Formulário de carteira (Figma Carteiras = formulário do Pagamento): dois
 * campos por linha, rede e tipo de carteira em select, validação local e da
 * API (422 por campo; endereço já usado na outra carteira volta no endereço).
 */
export function WalletForm({
  slot,
  initial,
  lockedFields = [],
  derive,
  onSaved,
  extraActions,
}: WalletFormProps) {
  const save = useSaveWallet()
  const formRef = useRef<HTMLFormElement>(null)
  const [typed, setTyped] = useState<WalletDraft>(initial)
  const [errors, setErrors] = useState<FieldMessages>({})
  const values = derive ? derive(typed) : typed
  const locked = (field: keyof WalletDraft) => lockedFields.includes(field)

  const set = (field: keyof WalletDraft, value: string) => {
    setTyped((current) => ({ ...current, [field]: value }))
    if (errors[field]) {
      setErrors((current) => Object.fromEntries(Object.entries(current).filter(([key]) => key !== field)))
    }
  }

  const showErrors = (found: FieldMessages) => {
    setErrors(found)
    focusFirstInvalid(formRef.current)
  }

  const submit = (event: SyntheticEvent) => {
    event.preventDefault()
    const input: WalletInput = { ...values, slot }
    const found = validateWalletDraft(input)
    if (Object.keys(found).length > 0) {
      showErrors(found)
      return
    }
    save.mutate(input, {
      onSuccess: () => {
        setErrors({})
        onSaved('Carteira salva.')
      },
      onError: (error) => {
        const fields = fieldErrorsOf(error, 'address')
        if (fields) {
          showErrors(fields)
          return
        }
        const message = userMessageFor(error)
        if (message) notify.error(message)
      },
    })
  }

  const text = (field: keyof WalletDraft) => ({
    value: values[field],
    errors: errors[field],
    readOnly: locked(field),
    onChange: (event: ChangeEvent<HTMLInputElement>) => {
      set(field, event.target.value)
    },
  })

  return (
    <form
      ref={formRef}
      noValidate
      onSubmit={submit}
      className="flex flex-col gap-6 [&_input:read-only]:text-text-secondary"
    >
      <div className="grid gap-x-7 gap-y-5 md:grid-cols-2">
        <FormField
          label="Nome de exibição"
          markRequired
          aria-required="true"
          autoComplete="name"
          {...text('displayName')}
        />
        <FormField label="Apelido da carteira" markRequired aria-required="true" {...text('nickname')} />
        <SelectField
          label="Rede"
          markRequired
          placeholder="Selecione uma rede"
          options={networkOptions}
          value={values.network}
          errors={errors.network}
          onChange={(value) => {
            set('network', value)
          }}
        />
        <FormField label="Nome do perfil" markRequired aria-required="true" {...text('profileName')} />
        <FormField
          label="Endereço da carteira"
          markRequired
          aria-required="true"
          placeholder="Endereço 0x da carteira"
          autoComplete="off"
          spellCheck={false}
          {...text('address')}
        />
        <FormField
          label="ENS ou carteira secundária (opcional)"
          hideLabel
          placeholder="ENS ou carteira secundária (opcional)"
          autoComplete="off"
          spellCheck={false}
          {...text('secondaryAddressOrEns')}
          className={UNLABELED_OFFSET}
        />
        <SelectField
          label="Tipo de carteira"
          markRequired
          placeholder="Selecione uma carteira"
          options={providerOptions}
          value={values.provider}
          errors={errors.provider}
          disabled={locked('provider')}
          onChange={(value) => {
            set('provider', value)
          }}
        />
        <FormField
          label="Código de indicação"
          markRequired
          aria-required="true"
          placeholder="JNG-2026"
          autoCapitalize="characters"
          {...text('referralCode')}
        />
        <FormField
          label="E-mail"
          markRequired
          aria-required="true"
          type="email"
          autoComplete="email"
          {...text('email')}
        />
        <EnsField
          markRequired
          aria-required="true"
          value={values.ensName}
          errors={errors.ensName}
          readOnly={locked('ensName')}
          onValueChange={(value) => {
            set('ensName', value)
          }}
        />
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <Button type="submit" disabled={save.isPending} aria-busy={save.isPending || undefined}>
          Salvar carteira
        </Button>
        {extraActions}
      </div>
    </form>
  )
}
