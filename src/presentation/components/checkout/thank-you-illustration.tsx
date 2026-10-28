import { cn } from '@presentation/lib/utils'

/** Envelope "THANK YOU" em traço laranja (Figma Confirmação). Decorativo. */
export function ThankYouIllustration({ className }: { readonly className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 160 120"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn('text-primary', className)}
    >
      <path d="M38 52V20a6 6 0 0 1 6-6h72a6 6 0 0 1 6 6v32" />
      <path d="M20 50l60 40 60-40" />
      <path d="M20 50v56a6 6 0 0 0 6 6h108a6 6 0 0 0 6-6V50" />
      <path d="M20 112l46-34M140 112L94 78" />
      <text
        x="80"
        y="38"
        textAnchor="middle"
        fill="currentColor"
        stroke="none"
        fontSize="10"
        fontWeight="700"
        letterSpacing="1"
      >
        THANK YOU
      </text>
    </svg>
  )
}
