# Design system — Figma

Fonte: [Figma do desafio](https://www.figma.com/design/Ff0SksUi7UFtPWUO8kyNtw/Frontend-Challenge?node-id=0-1), página "Marketplace de NFTs GreenMint". Marca exibida no layout: **KURIO**.

Valores lidos do painel Properties (estilos publicados no arquivo). Itens com ⚠️ precisam de conferência no próprio Figma.

## Frames

| Frame | Largura | Altura |
| --- | --- | --- |
| Desktop / Início | 1440 | 3668 (hug) |
| Desktop / Detalhes do NFT | 1440 | 2246 (hug) |
| Desktop / Carrinho de NFTs | 1440 | 1754 (hug) |
| Desktop / Pagamento | 1440 | 1657 (hug) |
| Desktop / Confirmação de Pedido | 1440 | 1657 (hug) |
| Desktop / Login | 1440 | 1981 (hug) |
| Desktop / Cadastro | 1440 | 1981 (hug) |
| Desktop / Perfil do Colecionador | 1440 | 1080 (fixo) |
| Desktop / Carteiras | 1440 | 1080 (fixo) |
| Mobile / Início, Detalhes do NFT, Carrinho de NFTs, Pagamento, Login, Cadastro | 414 | 896 (fixo; padding 40 no topo e 24 nas laterais) |

Sem frame mobile: Perfil, Carteiras e Confirmação (o enunciado exige que funcionem em mobile mesmo assim).

## Layout desktop (frame raiz)

- Fluxo vertical, largura fixa 1440.
- Padding: 24 em cima e embaixo, 120 nas laterais (conteúdo útil de 1200).
- Gap entre seções: 96.
- Fundo: `Color/Ink`.

## Cores

### Color

| Token | Hex |
| --- | --- |
| Primary | `#D28A4C` |
| Primary Light | `#DD9A5F` |
| Primary Dark | `#C47B3E` |
| Amber | `#E3A44E` |
| Foreground | `#F5F1EB` |
| Background Elevated | `#FBFBFB` |
| White | `#FFFFFF` |
| Black | `#000000` |
| Secondary | `#B39463` |
| Surface Card | `#241612` |
| Surface Raised | `#2F1D15` |
| Ink | `#140D0A` |
| Surface Dark | `#38220F` |
| Border | `#3F2319` |
| Border Soft | `#55321F` |
| Gray Light | `#EDEDED` |
| Success | `#00A66C` |
| Error | `#ED1B2E` |

### Text

| Token | Hex |
| --- | --- |
| Text / Primary | `#F7F3EC` |
| Text / Secondary | `#CFB28C` |
| Text / Accent | `#E89B55` |
| Text / Coral | `#F0805F` |

### Logo (marcas de terceiros)

Login social (Google, Facebook): o Figma não estava acessível na implementação; valem as cores oficiais publicadas pelas marcas, em tokens `--palette-brand-*` de `globals.css`:

| Token | Hex | Fonte |
| --- | --- | --- |
| Google Blue | `#4285F4` | Google brand guidelines (logo "G") |
| Google Green | `#34A853` | idem |
| Google Yellow | `#FBBC05` | idem |
| Google Red | `#EA4335` | idem |
| Facebook | `#1877F2` | Meta brand resources |

Orange `#FF641A`, Blue, Light Blue e Indigo (logos de carteiras): ⚠️ conferir no Figma quando as carteiras forem implementadas.

## Imagens dos NFTs

Fonte: as 4 artes originais do arquivo (PNG 1254×1254), guardadas em `assets/figma/nfts/kurio-nft-{1..4}.png` (R75). Os cards do Figma repetem essas 4 artes.

`npm run images:nfts` (`scripts/optimize-nft-images.mjs`, sharp) gera em `public/images/nfts` as variantes `kurio-nft-N-{160,320,480,640,960}.{avif,webp,jpg}`. A API envia a variante JPEG de 640 px como `url` (fallback); o componente `NftImage` monta `<picture>` com AVIF, WebP e JPEG, `srcset`/`sizes` e dimensões explícitas (sem deslocamento de layout).

| Arte | Personagem no Figma |
| --- | --- |
| 1 | Macaco de óculos e jaqueta verde (Emerald Ape #042, hero) |
| 2 | Gorila de chapéu e moletom lilás (Sage Nomad #009) |
| 3 | Gorila de blazer (Neon Vessel #552) |
| 4 | Macaco laranja com fones (Golden Beat #207) |

## Tipografia

Família: **Roboto Mono** (texto monoespaçado no canvas; pesos 400 e 700 carregados pelo arquivo; 300 e 500 aparecem nos estilos). Confirmado no painel: `font-family: Roboto Mono` em todos os textos. Servida localmente por `@fontsource-variable/roboto-mono` (eixo de peso 100–700).

Formato: tamanho / altura de linha em px. "Auto" = altura de linha normal.

| Grupo | Estilos |
| --- | --- |
| Display | 43 Bold 43/70 · 32 Bold 32/Auto |
| Heading | 28 Bold 28/Auto · 26 Bold 26/32 · 24 Bold 24/Auto |
| Title | 23 Bold 23/16 · 22 Bold 22/16 · 22 Regular 22/29 · 21 Regular 21/16 · 20 Regular 20/28 · 20 Medium 20/16 · 20 Bold 20/16 |
| Body Large | 19 Bold 19/29 · 18 Bold 18/16 · 18 Regular 18/16 · 18 Light 18/16 · 18 Bold 18/24 · 18 Medium 18/25 · 17 Bold 17/16 · 17 Regular 17/16 · 17 Regular 17/24 · 16 Bold/Regular/Medium 16/Auto · 16 Bold 16/20 · 16 Regular/Medium/Bold 16/16 · 16 Regular 16/22 |
| Body | 15 Medium 15/16 · 15 Regular 15/Auto · 15 Regular 15/40 · 15 Bold 15/40 · 15 Bold 15/16 · 15 Regular 15/15 · 15 Regular 15/45 · 15 Bold 15/15 · 14 Bold 14/Auto · 14 Medium 14/16 · 14 Regular 14/24 · 14 Regular 14/22 · 14 Medium 14/20 · 14 Regular 14/30 · 14 Regular 14/16 · 14 Bold 14/24 · 14 Bold 14/20 · 14 Bold 14/16 · 14 Regular 14/15 |
| Caption | 13 Regular 13/22 · 13 Regular 13/16 · 13 Medium 13/16 · 12 Regular 12/16 · 12 Regular 12/18 · 12 Bold 12/14 |
| Tiny | 11 Medium 11/16 · 10 Medium 10/Auto · 9 Bold 9/Auto |

O arquivo tem muitas variações de altura de linha para o mesmo tamanho. No código, consolidar em uma escala menor (tamanho + peso + altura de linha) e registrar a consolidação como desvio no `ARCHITECTURE.md` quando a diferença for perceptível.

## Como inspecionar

Com login no Figma, painel **Properties** à direita: selecionar uma camada mostra layout, espaçamentos, cores e tipografia; clique direito → *Copy/Paste as* → *Copy as code* gera o CSS do elemento. O arquivo está em modo somente leitura (Dev Mode indisponível).
