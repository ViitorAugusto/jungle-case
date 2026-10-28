import { MailIcon } from 'lucide-react'

import type { Nft } from '@application/dtos'

import { LinkedinIcon, TwitterIcon } from '@presentation/components/layout/social-icons'

type ShareTarget = {
  readonly label: string
  readonly href: (url: string, text: string) => string
  readonly icon: React.ReactNode
  readonly external: boolean
}

const targets: readonly ShareTarget[] = [
  {
    label: 'Compartilhar no LinkedIn',
    href: (url) => `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
    icon: <LinkedinIcon className="size-4.5" />,
    external: true,
  },
  {
    label: 'Compartilhar por e-mail',
    href: (url, text) => `mailto:?subject=${encodeURIComponent(text)}&body=${encodeURIComponent(url)}`,
    icon: <MailIcon aria-hidden="true" className="size-4.5" />,
    external: false,
  },
  {
    label: 'Compartilhar no Twitter',
    href: (url, text) =>
      `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
    icon: <TwitterIcon className="size-4.5" />,
    external: true,
  },
]

/** "Compartilhar este NFT:" do Figma, com LinkedIn, e-mail e Twitter (link da página atual). */
export function NftShare({ nft, className }: { readonly nft: Nft; readonly className?: string }) {
  const url = typeof window === 'undefined' ? '' : window.location.href
  const text = `${nft.name} na Kurio`

  return (
    <div className={className}>
      <span className="text-body leading-5 font-bold text-foreground">Compartilhar este NFT:</span>
      <ul className="flex items-center">
        {targets.map((target) => (
          <li key={target.label}>
            <a
              href={target.href(url, text)}
              aria-label={target.label}
              {...(target.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
              className="flex size-6 items-center justify-center rounded-xs text-foreground focus-ring hover:text-text-accent"
            >
              {target.icon}
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}
