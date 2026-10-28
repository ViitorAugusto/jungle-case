import { StatePanel } from '@presentation/components/feedback/state-panel'
import { RatingStars } from '@presentation/components/nft/rating-stars'
import { Button } from '@presentation/components/ui/button'
import { Skeleton } from '@presentation/components/ui/skeleton'
import { useNftReviews } from '@presentation/hooks/use-catalog'
import { formatReviewDate } from '@presentation/lib/format'

const SKELETON_ROWS = 3

/**
 * Conteúdo da aba "Avaliações de colecionadores": autor, nota em estrelas,
 * data e comentário, mais recentes primeiro. O Figma não desenha a aba aberta;
 * a lista segue a tipografia e as cores da aba "Detalhes do NFT".
 */
export function NftReviewsList({ nftId }: { readonly nftId: string }) {
  const reviews = useNftReviews(nftId)

  if (reviews.isPending) {
    return (
      <ul aria-busy="true" aria-label="Carregando avaliações" className="flex flex-col gap-6">
        {Array.from({ length: SKELETON_ROWS }, (_, index) => (
          <li key={index}>
            <Skeleton className="h-18 w-full rounded-sm" />
          </li>
        ))}
      </ul>
    )
  }

  if (reviews.isError) {
    return (
      <StatePanel
        role="alert"
        title={
          <p className="text-lead font-bold text-foreground">Não foi possível carregar as avaliações.</p>
        }
        actions={<Button onClick={() => void reviews.refetch()}>Tentar novamente</Button>}
      />
    )
  }

  if (reviews.data.items.length === 0) {
    return <p className="text-body-sm text-text-secondary">Este NFT ainda não tem avaliações.</p>
  }

  return (
    <ul className="flex flex-col divide-y divide-primary/25">
      {reviews.data.items.map((review) => (
        <li key={review.id} className="flex gap-4 py-5 first:pt-1">
          <img
            src={review.author.avatarUrl}
            alt=""
            width={40}
            height={40}
            loading="lazy"
            className="size-10 shrink-0 rounded-full bg-surface-raised object-cover"
          />
          <article className="flex min-w-0 flex-col gap-1.5 text-body-sm leading-6">
            <header className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <h3 className="font-bold text-foreground">{review.author.name}</h3>
              <span className="sr-only">Nota {review.rating} de 5.</span>
              <RatingStars value={review.rating} />
              <time dateTime={review.createdAt} className="text-small text-subtle">
                {formatReviewDate(review.createdAt)}
              </time>
            </header>
            <p className="text-text-secondary">{review.comment}</p>
          </article>
        </li>
      ))}
    </ul>
  )
}
