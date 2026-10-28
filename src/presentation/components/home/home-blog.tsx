import { NftImage } from '@presentation/components/nft/nft-image'
import { kurioArt } from '@presentation/lib/responsive-image'

const posts = [
  {
    meta: '12 de setembro | Leitura de 6 min',
    title: 'Como funciona a propriedade de NFTs',
    text: 'Aprenda a colecionar, negociar e verificar ativos digitais.',
    image: kurioArt(3),
  },
  {
    meta: '13 de setembro | Leitura de 2 min',
    title: '10 artistas digitais para acompanhar',
    text: 'Conheça criadores que moldam a cultura digital.',
    image: kurioArt(1),
  },
  {
    meta: '15 de setembro | Leitura de 3 min',
    title: 'Raridade, atributos e procedência',
    text: 'Entenda raridade, procedência, direitos autorais e utilidade.',
    image: kurioArt(2),
  },
  {
    meta: '15 de setembro | Leitura de 2 min',
    title: 'Como proteger sua carteira',
    text: 'Proteja sua carteira, seus ativos e sua identidade.',
    image: kurioArt(4),
  },
] as const

/**
 * "Diário da Cunhagem". Conteúdo editorial está fora do escopo (premissa 15):
 * "Ler mais" aparece desabilitado com "Em breve" em vez de levar a lugar nenhum.
 */
export function HomeBlog() {
  return (
    <section aria-labelledby="diario-titulo" className="flex flex-col items-center gap-10 defer-render">
      <div className="flex flex-col items-center gap-0 text-center">
        <h2 id="diario-titulo" className="text-heading-lg font-bold text-foreground">
          Diário da Cunhagem
        </h2>
        <p className="text-body-sm leading-compact text-text-secondary">
          Histórias, guias e insights para colecionadores sobre o universo da propriedade digital.
        </p>
      </div>
      <ul className="grid w-full gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {posts.map((post) => (
          <li key={post.title}>
            <article className="flex h-full flex-col overflow-hidden rounded-md bg-surface-card">
              <NftImage
                image={{ url: post.image, alt: '' }}
                decorative
                sizes="(min-width: 1024px) 268px, (min-width: 640px) 50vw, calc(100vw - 48px)"
                className="aspect-268/195 w-full"
              />
              <div className="flex flex-1 flex-col gap-2 px-4 pt-3 pb-4">
                <p className="text-small font-medium text-text-secondary">{post.meta}</p>
                <h3 className="text-body-lg font-bold text-foreground">{post.title}</h3>
                <p className="text-small font-medium text-text-secondary">{post.text}</p>
                <span
                  role="link"
                  aria-disabled="true"
                  title="Em breve"
                  className="mt-auto inline-flex cursor-not-allowed gap-1 text-small leading-3.5 font-bold text-text-accent/70"
                >
                  Ler mais <span aria-hidden="true">→</span>
                  <span className="sr-only">(em breve)</span>
                </span>
              </div>
            </article>
          </li>
        ))}
      </ul>
    </section>
  )
}
