import { cn } from '@presentation/lib/utils'

/**
 * Envelope aberto com a carta "THANK YOU" em traço laranja (Figma
 * Confirmação, 66 × 80 px). Decorativo.
 */
export function ThankYouIllustration({ className }: { readonly className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 66 80"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn('text-primary', className)}
    >
      <path d="M27 7a6 6 0 0 1 12 0" />
      <path d="M7 50V9a2 2 0 0 1 2-2h48a2 2 0 0 1 2 2v41" />
      <path d="M7 28l-5 5v43a2 2 0 0 0 2 2h58a2 2 0 0 0 2-2V33l-5-5" />
      <path d="M2 34l18 16M64 34L50 46" />
      <path d="M20 62l9-8a6 6 0 0 1 8 0l9 8" />
      <path d="M2 77l22-19M64 77L43 59" />
      <text
        x="33"
        y="24"
        textAnchor="middle"
        fill="currentColor"
        stroke="none"
        fontSize="12.5"
        fontWeight="700"
      >
        THANK
      </text>
      <text
        x="33"
        y="38.5"
        textAnchor="middle"
        fill="currentColor"
        stroke="none"
        fontSize="12.5"
        fontWeight="700"
      >
        YOU
      </text>
    </svg>
  )
}
