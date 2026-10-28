import { useId, type SyntheticEvent } from 'react'
import { notify } from '@presentation/lib/notify'

import { BrandLogo } from '@presentation/components/layout/brand-logo'
import {
  FacebookIcon,
  InstagramIcon,
  LinkedinIcon,
  TwitterIcon,
  YoutubeIcon,
} from '@presentation/components/layout/social-icons'

const features = [
  {
    mark: 'W',
    title: 'Segurança da carteira',
    text: 'Proteja sua carteira e colecione arte digital verificada com confiança.',
  },
  {
    mark: 'C',
    title: 'Criadores em destaque',
    text: 'Conheça artistas, estúdios e comunidades que moldam a cultura digital na rede.',
  },
  {
    mark: 'D',
    title: 'Alertas de lançamentos',
    text: 'Receba calendários de cunhagem, novidades de listas de acesso e análises do mercado.',
  },
] as const

/** Colunas institucionais: fora do escopo (premissa 15), exibidas como texto, sem simular navegação. */
const linkColumns = [
  {
    title: 'Meu perfil',
    items: ['Meu perfil', 'Minha coleção', 'Atividade', 'Estúdio do criador', 'Lista de interesse'],
  },
  {
    title: 'Central de ajuda',
    items: [
      'Central de ajuda',
      'Como comprar NFTs',
      'Carteira e segurança',
      'Política do mercado',
      'Denunciar item',
    ],
  },
  { title: 'Coleções', items: ['Arte digital', 'Fotografia', 'Música', 'Arte 3D', 'Utilidade'] },
] as const

const socials = [
  { label: 'Facebook', Icon: FacebookIcon },
  { label: 'Instagram', Icon: InstagramIcon },
  { label: 'Twitter', Icon: TwitterIcon },
  { label: 'LinkedIn', Icon: LinkedinIcon },
  { label: 'YouTube', Icon: YoutubeIcon },
] as const

function NewsletterForm() {
  const inputId = useId()
  const submit = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault()
    notify.info('O cadastro para alertas de lançamentos ainda não está disponível.')
  }

  return (
    <div className="flex flex-col gap-4 md:px-4">
      <h2 className="text-lead leading-compact font-bold text-foreground">
        Antecipe-se ao próximo lançamento
      </h2>
      <form onSubmit={submit} className="flex h-10 items-stretch rounded-sm bg-surface-dark shadow-field">
        <label htmlFor={inputId} className="sr-only">
          Endereço eletrônico para alertas de lançamentos
        </label>
        <input
          id={inputId}
          type="email"
          autoComplete="email"
          placeholder="digite seu e-mail..."
          className="min-w-0 flex-1 rounded-l-sm bg-transparent px-3 text-body-sm text-foreground focus-ring placeholder:text-subtle"
        />
        <button
          type="submit"
          className="cursor-pointer rounded-r-sm bg-primary pr-1 pl-4 text-lead font-bold text-primary-foreground focus-ring hover:bg-primary-light"
        >
          Enviar
        </button>
      </form>
      <p className="text-caption leading-5.5 text-text-secondary">
        Receba lançamentos selecionados, histórias de criadores e novidades do mercado.
      </p>
    </div>
  )
}

/** Rodapé do Figma (igual em todas as telas desktop; empilha no mobile). */
export function SiteFooter() {
  return (
    <footer className="mx-auto w-full max-w-content px-6 pb-24 md:px-10 md:pb-6 xl:px-0">
      <div className="bg-surface-card p-6 md:p-8">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-(--layout-footer-columns) lg:items-end lg:gap-7">
          {features.map((feature) => (
            <section
              key={feature.mark}
              className="flex flex-col gap-3 lg:border-r lg:border-primary lg:pb-1 lg:pl-4"
            >
              <span
                aria-hidden="true"
                className="flex size-18.5 items-center justify-center rounded-full bg-primary text-heading font-bold text-primary-foreground"
              >
                {feature.mark}
              </span>
              <h2 className="text-lead-sm font-bold text-foreground">{feature.title}</h2>
              <p className="max-w-51 text-body-sm text-text-secondary">{feature.text}</p>
            </section>
          ))}
          <NewsletterForm />
        </div>
      </div>

      <div className="grid gap-4 bg-surface-dark p-6 text-body-sm text-foreground sm:grid-cols-2 md:p-8 lg:grid-cols-4 lg:items-center lg:gap-23">
        <BrandLogo asLink={false} />
        <p>Feito para colecionadores, criadores e cultura</p>
        <p>contato@email.com</p>
        <p>+55 11 4002 8922</p>
      </div>

      <div className="grid gap-8 bg-surface-card p-6 sm:grid-cols-2 md:p-8 lg:grid-cols-4 lg:gap-31">
        {linkColumns.map((column) => (
          <section key={column.title} className="flex flex-col gap-2">
            <h2 className="text-lead leading-4 font-bold text-foreground">{column.title}</h2>
            <ul className="text-body-sm leading-list text-foreground">
              {column.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
        ))}
        <div className="flex flex-col gap-8">
          <section className="flex flex-col gap-5">
            <h2 className="text-lead leading-4 font-bold text-foreground">Redes sociais</h2>
            <ul className="flex gap-2.5">
              {socials.map(({ label, Icon }) => (
                <li
                  key={label}
                  className="flex size-7.5 items-center justify-center rounded-xs border border-primary text-primary"
                >
                  <Icon className="size-4" />
                  <span className="sr-only">{label}</span>
                </li>
              ))}
            </ul>
          </section>
          <section className="flex flex-col gap-3">
            <h2 className="text-lead leading-4 font-bold text-foreground">Carteiras compatíveis</h2>
            <p className="flex h-6.5 items-center justify-center rounded-sm border border-border-soft bg-surface-dark px-2 text-nano font-bold whitespace-nowrap text-text-accent">
              METAMASK · WALLETCONNECT · COINBASE
            </p>
          </section>
        </div>
      </div>

      <p className="mt-1.5 text-center text-body-sm leading-list text-foreground">
        © 2026 Kurio. Propriedade digital para todos.
      </p>
    </footer>
  )
}
