import type { SVGProps } from 'react'

/** Ícones das redes sociais do rodapé (glifos simplificados, cor pelo `currentColor`). */
type IconProps = SVGProps<SVGSVGElement>

const base = { viewBox: '0 0 24 24', fill: 'currentColor', 'aria-hidden': true } as const

export const FacebookIcon = (props: IconProps) => (
  <svg {...base} {...props}>
    <path d="M14 8h3V4h-3c-2.8 0-4.5 1.8-4.5 4.6V11H7v4h2.5v9h4v-9h3l.5-4h-3.5V9c0-.6.4-1 1-1Z" />
  </svg>
)

export const InstagramIcon = (props: IconProps) => (
  <svg {...base} {...props}>
    <path d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5Zm0 2a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3H7Zm5 3.5a4.5 4.5 0 1 1 0 9 4.5 4.5 0 0 1 0-9Zm0 2a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5ZM17.5 5.5a1 1 0 1 1 0 2 1 1 0 0 1 0-2Z" />
  </svg>
)

export const TwitterIcon = (props: IconProps) => (
  <svg {...base} {...props}>
    <path d="M22 5.8c-.7.3-1.5.5-2.4.6a4.1 4.1 0 0 0 1.8-2.3c-.8.5-1.7.8-2.6 1a4.1 4.1 0 0 0-7 3.7A11.6 11.6 0 0 1 3.4 4.6a4.1 4.1 0 0 0 1.3 5.5c-.7 0-1.3-.2-1.9-.5 0 2 1.4 3.7 3.3 4.1-.6.2-1.2.2-1.9.1a4.1 4.1 0 0 0 3.8 2.8A8.2 8.2 0 0 1 2 18.3a11.6 11.6 0 0 0 6.3 1.8c7.5 0 11.7-6.3 11.7-11.7v-.5c.8-.6 1.5-1.3 2-2.1Z" />
  </svg>
)

export const LinkedinIcon = (props: IconProps) => (
  <svg {...base} {...props}>
    <path d="M4.5 3a2 2 0 1 1 0 4 2 2 0 0 1 0-4ZM3 9h3v12H3V9Zm6 0h3v1.7c.5-.9 1.7-2 3.6-2 3.4 0 4.4 2.2 4.4 5.3v7H17v-6.2c0-1.6-.3-3-2-3s-2.3 1.3-2.3 3V21H9V9Z" />
  </svg>
)

export const YoutubeIcon = (props: IconProps) => (
  <svg {...base} {...props}>
    <path d="M21.6 7.2a2.5 2.5 0 0 0-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.8.4a2.5 2.5 0 0 0-1.8 1.8C2 8.8 2 12 2 12s0 3.2.4 4.8a2.5 2.5 0 0 0 1.8 1.8C5.8 19 12 19 12 19s6.2 0 7.8-.4a2.5 2.5 0 0 0 1.8-1.8c.4-1.6.4-4.8.4-4.8s0-3.2-.4-4.8ZM10 15V9l5.2 3L10 15Z" />
  </svg>
)
