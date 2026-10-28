import { ImageIcon } from 'lucide-react'
import { useId, useState, type ChangeEvent } from 'react'

import { AVATAR_MIME_TYPES, validateAvatar } from '@application/dtos'

import { Button, buttonVariants } from '@presentation/components/ui/button'
import { useRemoveAvatar, useUpdateAvatar } from '@presentation/hooks/use-account'
import { userMessageFor } from '@presentation/lib/errors'
import { fieldErrorsOf } from '@presentation/lib/form-errors'
import { cn } from '@presentation/lib/utils'

const readAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      resolve(typeof reader.result === 'string' ? reader.result : '')
    }
    reader.onerror = () => {
      reject(reader.error ?? new Error('Falha ao ler a imagem'))
    }
    reader.readAsDataURL(file)
  })

/**
 * "Avatar" do Figma: círculo com a foto (ou ícone), "Alterar" (PNG, JPEG ou
 * WebP até 512 KB, conferido antes do envio) e "Remover". A prévia aparece
 * enquanto a API grava; falha volta à foto anterior com o erro anunciado.
 */
export function AvatarField({ avatarUrl }: { readonly avatarUrl: string | null }) {
  const inputId = useId()
  const hintId = useId()
  const update = useUpdateAvatar()
  const remove = useRemoveAvatar()
  const [preview, setPreview] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const busy = update.isPending || remove.isPending
  const shown = preview ?? avatarUrl

  const fail = (reason: unknown) => {
    setPreview(null)
    const fields = fieldErrorsOf(reason)
    setError(fields ? Object.values(fields).flat().join(' ') : userMessageFor(reason))
  }

  const choose = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    const invalid = validateAvatar({ type: file.type, size: file.size }).avatar
    if (invalid) {
      setError(invalid.join(' '))
      return
    }
    setError(null)
    try {
      const dataUrl = await readAsDataUrl(file)
      setPreview(dataUrl)
      update.mutate(
        { dataUrl, type: file.type, size: file.size },
        {
          onSuccess: () => {
            setPreview(null)
          },
          onError: fail,
        },
      )
    } catch (reason) {
      fail(reason)
    }
  }

  return (
    <div className="flex flex-col gap-2 md:-mt-1.75">
      <span className="text-body leading-5 text-foreground">Avatar</span>
      <div className="flex items-center gap-6">
        {shown ? (
          <img
            src={shown}
            alt="Avatar"
            width={50}
            height={50}
            className="size-12.5 rounded-full object-cover"
          />
        ) : (
          <span
            role="img"
            aria-label="Avatar"
            className="flex size-12.5 items-center justify-center rounded-full border border-border bg-surface-raised text-text-accent"
          >
            <ImageIcon aria-hidden="true" className="size-icon-sm" />
          </span>
        )}
        <input
          id={inputId}
          type="file"
          accept={AVATAR_MIME_TYPES.join(',')}
          aria-label="Alterar avatar"
          aria-describedby={hintId}
          disabled={busy}
          onChange={(event) => {
            void choose(event)
          }}
          className="peer sr-only"
        />
        <label
          htmlFor={inputId}
          aria-hidden="true"
          className={cn(
            buttonVariants(),
            'h-10 w-24.5 rounded-xs px-0 text-body',
            'peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ring peer-disabled:cursor-not-allowed peer-disabled:opacity-50',
          )}
        >
          Alterar
        </label>
        {/* Figma: "Remover" sempre visível; sem avatar fica indisponível (aria-disabled), sem aparentar efeito. */}
        <Button
          type="button"
          variant="link"
          size="sm"
          aria-label="Remover avatar"
          aria-disabled={avatarUrl ? undefined : true}
          title={avatarUrl ? undefined : 'Sem avatar para remover'}
          disabled={busy}
          onClick={() => {
            if (!avatarUrl) return
            setError(null)
            remove.mutate(undefined, { onError: fail })
          }}
          className="-ml-1.5 px-0 text-body font-normal text-foreground no-underline hover:text-text-accent aria-disabled:opacity-100"
        >
          Remover
        </Button>
      </div>
      <p id={hintId} className="sr-only">
        PNG, JPEG ou WebP, até 512 KB.
      </p>
      {error ? (
        <p role="alert" className="flex items-start gap-1 text-small text-destructive-foreground">
          <span aria-hidden="true" className="font-bold">
            !
          </span>
          {error}
        </p>
      ) : null}
    </div>
  )
}
