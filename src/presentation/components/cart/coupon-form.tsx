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
      <label htmlFor={inputId} className="text-body-sm leading-4 font-bold text-foreground max-md:sr-only">
        Código promocional
      </label>
      {/* Figma: pílula de 50 px com "Aplicar" em degradê no mobile; contorno laranja de 40 px no desktop. */}
      <div className="flex h-12.5 items-stretch rounded-full border border-border shadow-field md:h-10 md:rounded-xs md:border-primary md:shadow-none">
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
          className="min-w-0 flex-1 rounded-l-full bg-transparent pl-4 text-caption text-foreground focus-ring placeholder:text-subtle aria-invalid:outline-destructive md:rounded-l-xs md:pl-2 md:text-small"
        />
        <button
          type="submit"
          disabled={apply.isPending}
          className="-my-px -mr-px w-24.25 shrink-0 cursor-pointer rounded-full bg-(image:--gradient-apply) text-body-lg font-bold text-primary-foreground focus-ring hover:brightness-110 disabled:opacity-50 md:my-0 md:mr-0 md:w-25.25 md:rounded-none md:rounded-r-xs md:bg-primary md:bg-none md:text-body md:hover:bg-primary-light md:hover:brightness-100"
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
