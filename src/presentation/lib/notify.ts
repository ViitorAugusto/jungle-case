import type * as Sonner from 'sonner'
import type { ExternalToast } from 'sonner'

/**
 * Toasts carregados sob demanda: o sonner fica fora do caminho crítico. O
 * Toaster é montado pelo layout raiz alguns segundos depois do `load`
 * (`preloadNotifications`) ou no primeiro aviso, o que vier antes; o aviso só é
 * entregue depois que o Toaster montou, porque o sonner descarta os anteriores.
 * Se o chunk não baixar (offline), a mensagem vai para a região `aria-live` do
 * layout raiz (`FALLBACK_REGION_ID`), sem se perder.
 */
export const FALLBACK_REGION_ID = 'avisos'
const FALLBACK_DURATION_MS = 6000
/** Prazo para o Toaster montar; passado ele, o aviso vai para a região `aria-live`. */
const TOASTER_MOUNT_TIMEOUT_MS = 5000

let mountToaster: (() => void) | null = null
let markReady: () => void = () => undefined
const toasterReady = new Promise<void>((resolve) => {
  markReady = resolve
})

/** O layout raiz informa como montar o Toaster. Devolve a função que desfaz o registro. */
export const registerToasterHost = (mount: () => void) => {
  mountToaster = mount
  return () => {
    if (mountToaster === mount) mountToaster = null
  }
}

/** Chamado pelo Toaster ao montar (`onMounted`). */
export const markToasterMounted = () => {
  markReady()
}

const ensureToaster = (): Promise<void> => {
  if (!mountToaster) return Promise.resolve()
  mountToaster()
  return new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error('Toaster não montou a tempo'))
    }, TOASTER_MOUNT_TIMEOUT_MS)
    void toasterReady.then(() => {
      clearTimeout(timer)
      resolve()
    })
  })
}

let pending: Promise<typeof Sonner> | null = null
const loadSonner = () => {
  pending ??= import('sonner').catch((error: unknown) => {
    pending = null
    throw error
  })
  return pending
}

let clearTimer: ReturnType<typeof setTimeout> | undefined
const announceFallback = (message: string) => {
  const region = document.getElementById(FALLBACK_REGION_ID)
  if (!region) return
  region.textContent = message
  clearTimeout(clearTimer)
  clearTimer = setTimeout(() => {
    region.textContent = ''
  }, FALLBACK_DURATION_MS)
}

type Kind = 'success' | 'error' | 'info'

const show = (kind: Kind, message: string, options?: ExternalToast) => {
  Promise.all([loadSonner(), ensureToaster()]).then(
    ([{ toast }]) => {
      toast[kind](message, options)
    },
    () => {
      announceFallback(message)
    },
  )
}

export const notify = {
  success: (message: string, options?: ExternalToast) => {
    show('success', message, options)
  },
  error: (message: string, options?: ExternalToast) => {
    show('error', message, options)
  },
  info: (message: string, options?: ExternalToast) => {
    show('info', message, options)
  },
}

/** Espera depois do `load` antes do preload: o carregamento inicial (dados e imagem principal) vem primeiro. */
const PRELOAD_DELAY_MS = 3000

/**
 * Baixa o sonner no ocioso, para o primeiro aviso não depender da rede. Só
 * começa alguns segundos depois do `load`, para não disputar banda com o
 * caminho crítico; um aviso antes disso carrega o chunk na hora.
 */
export const preloadNotifications = (extra?: () => void) => {
  const run = () => {
    loadSonner().catch(() => undefined)
    extra?.()
  }
  const schedule = () => {
    setTimeout(() => {
      if ('requestIdleCallback' in window) window.requestIdleCallback(run, { timeout: 3000 })
      else run()
    }, PRELOAD_DELAY_MS)
  }
  if (document.readyState === 'complete') schedule()
  else window.addEventListener('load', schedule, { once: true })
}
