import { useId, useState, type SyntheticEvent } from 'react'

import { isApplicationError, type AppliedCoupon } from '@application/dtos'

import { Button } from '@presentation/components/ui/button'
import { useApplyCoupon, useRemoveCoupon } from '@presentation/hooks/use-cart'
import { userMessageFor } from '@presentation/lib/errors'
import { notify } from '@presentation/lib/notify'

/** Mensagem do campo: inválido/expirado (422) vêm da API em pt-BR. */
const couponErrorOf = (error: unknown): string[] | undefined => {
  if (!error) return undefined
  if (isApplicationError(error))
    return error.fieldErrors.code?.length ? [...error.fieldErrors.code] : [error.message]
  const message = userMessageFor(error)
  return message ? [message] : undefined
}

/** Cupom do resumo: aplicar (erro no próprio campo) ou remover o aplicado. */
export function CouponForm({ coupon }: { readonly coupon: AppliedCoupon | null }) {
  const apply = useApplyCoupon()
  const remove = useRemoveCoupon()
  const [code, setCode] = useState('')
  const inputId = useId()
  const errorId = useId()

  if (coupon) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-sm border border-border-soft bg-surface-dark px-3 py-2">
        <p className="text-body-sm text-foreground">
          Cupom <strong className="text-text-accent">{coupon.code}</strong>
          <span className="block text-small text-text-secondary">{coupon.description}</span>
        </p>
        <Button
          variant="ghost"
          size="xs"
          disabled={remove.isPending}
          onClick={() => {
            remove.mutate(undefined, {
              onError: (error) => {
                const message = userMessageFor(error)
                if (message) notify.error(message)
              },
            })
          }}
        >
          Remover cupom
        </Button>
      </div>
    )
  }

  const submit = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault()
    const trimmed = code.trim()
    if (!trimmed) return
    apply.mutate(trimmed, {
      onSuccess: () => {
        setCode('')
        notify.success(`Cupom ${trimmed.toUpperCase()} aplicado.`)
      },
    })
  }

  const errors = couponErrorOf(apply.error)

  return (
    <form noValidate onSubmit={submit} className="flex flex-col gap-2">
      <label htmlFor={inputId} className="text-body-sm font-bold text-foreground">
        Código promocional
      </label>
      <div className="flex h-10 items-stretch rounded-sm bg-surface-dark shadow-field">
        <input
          id={inputId}
          name="coupon"
          autoComplete="off"
          autoCapitalize="characters"
          placeholder="Digite o código promocional..."
          value={code}
          aria-invalid={errors ? true : undefined}
          {...(errors ? { 'aria-describedby': errorId } : {})}
          onChange={(event) => {
            setCode(event.target.value)
            if (apply.error) apply.reset()
          }}
          className="min-w-0 flex-1 rounded-l-sm border border-r-0 border-transparent bg-transparent px-3 text-body-sm text-foreground focus-ring placeholder:text-subtle aria-invalid:border-destructive"
        />
        <button
          type="submit"
          disabled={apply.isPending}
          className="cursor-pointer rounded-r-sm bg-primary px-4 text-body-sm font-bold text-primary-foreground focus-ring hover:bg-primary-light disabled:opacity-50"
        >
          Aplicar
        </button>
      </div>
      {errors ? (
        <p id={errorId} className="flex items-start gap-1 text-small text-destructive-foreground">
          <span aria-hidden="true" className="font-bold">
            !
          </span>
          {errors.join(' ')}
        </p>
      ) : null}
    </form>
  )
}
