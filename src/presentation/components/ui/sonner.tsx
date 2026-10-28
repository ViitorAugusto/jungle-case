import { CircleCheckIcon, InfoIcon, Loader2Icon, OctagonXIcon, TriangleAlertIcon } from 'lucide-react'
import { useEffect } from 'react'
import { Toaster as Sonner, type ToasterProps } from 'sonner'

export type AppToasterProps = ToasterProps & {
  /** Chamado quando o Toaster já recebe avisos (o sonner descarta os criados antes de ele montar). */
  readonly onMounted?: () => void
}

/** Toasts: região `aria-live` do sonner; a interface tem tema único (escuro). */
const Toaster = ({ onMounted, ...props }: AppToasterProps) => {
  // Efeitos dos filhos rodam antes: aqui o sonner já está inscrito nos avisos.
  useEffect(() => {
    onMounted?.()
  }, [onMounted])

  return <ToasterView {...props} />
}

const ToasterView = (props: ToasterProps) => (
  <Sonner
    theme="dark"
    className="toaster group"
    containerAriaLabel="Notificações"
    icons={{
      success: <CircleCheckIcon className="size-4 text-success" />,
      info: <InfoIcon className="size-4 text-text-accent" />,
      warning: <TriangleAlertIcon className="size-4 text-amber" />,
      error: <OctagonXIcon className="size-4 text-destructive-foreground" />,
      loading: <Loader2Icon className="size-4 animate-spin" />,
    }}
    toastOptions={{
      classNames: { toast: 'font-sans! text-body-sm!', description: 'text-muted-foreground!' },
    }}
    style={
      {
        '--normal-bg': 'var(--popover)',
        '--normal-text': 'var(--popover-foreground)',
        '--normal-border': 'var(--border)',
        '--border-radius': 'var(--radius)',
      } as React.CSSProperties
    }
    {...props}
  />
)

export { Toaster }
