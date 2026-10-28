import { useSyncExternalStore } from 'react'

/** Reage a uma media query (ex.: renderizar a sidebar de filtros só no desktop). */
export const useMediaQuery = (query: string): boolean =>
  useSyncExternalStore(
    (onChange) => {
      const media = window.matchMedia(query)
      media.addEventListener('change', onChange)
      return () => {
        media.removeEventListener('change', onChange)
      }
    },
    () => window.matchMedia(query).matches,
  )
