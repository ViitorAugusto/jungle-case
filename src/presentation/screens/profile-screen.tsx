import { useState } from 'react'

import { StatePanel } from '@presentation/components/feedback/state-panel'
import { AccountLayout } from '@presentation/components/profile/account-layout'
import { ProfileForm } from '@presentation/components/profile/profile-form'
import { Button } from '@presentation/components/ui/button'
import { Skeleton } from '@presentation/components/ui/skeleton'
import { useProfile } from '@presentation/hooks/use-account'

/** Mesma grade do formulário pronto (dimensões estáveis). */
function ProfileSkeleton() {
  return (
    <div aria-busy="true" aria-label="Carregando perfil" className="flex flex-col gap-8">
      <div className="grid gap-x-7 gap-y-5 md:grid-cols-2">
        {Array.from({ length: 6 }, (_, index) => (
          <Skeleton key={index} className="h-18 rounded-sm" />
        ))}
      </div>
      <div className="grid gap-x-7 md:grid-cols-2">
        <Skeleton className="h-80 rounded-sm" />
      </div>
    </div>
  )
}

/** Perfil do colecionador (Figma): dados, avatar e senha com um único "Salvar". */
export function ProfileScreen() {
  const profile = useProfile()
  const [feedback, setFeedback] = useState('')

  return (
    <AccountLayout section="perfil" title="Perfil do colecionador">
      <p role="status" aria-live="polite" className="text-body-sm font-bold text-success empty:hidden">
        {feedback}
      </p>
      {profile.isError && !profile.data ? (
        <StatePanel
          role="alert"
          title={<p className="text-lead font-bold text-foreground">Não foi possível carregar o perfil.</p>}
          actions={<Button onClick={() => void profile.refetch()}>Tentar novamente</Button>}
        />
      ) : profile.data ? (
        <ProfileForm
          key={profile.data.id}
          profile={profile.data}
          onSaved={(message) => {
            // Limpa antes para o leitor de tela anunciar de novo uma mensagem repetida.
            setFeedback('')
            requestAnimationFrame(() => {
              setFeedback(message)
            })
          }}
        />
      ) : (
        <ProfileSkeleton />
      )}
    </AccountLayout>
  )
}
