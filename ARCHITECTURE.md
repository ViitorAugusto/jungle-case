# Arquitetura

Marketplace de NFTs em React + TypeScript. Toda a API (REST e Socket.IO) é simulada com MSW na camada de rede; a aplicação não sabe se fala com mocks ou com um servidor real.

Setup, comandos, credenciais e cenários estão no [README](README.md). Premissas de produto em [docs/decisoes/premissas.md](docs/decisoes/premissas.md).

## Sumário

1. [Stack](#1-stack)
2. [Camadas e pastas](#2-camadas-e-pastas)
3. [Contratos REST](#3-contratos-rest)
4. [Contratos de eventos (Socket.IO)](#4-contratos-de-eventos-socketio)
5. [Sessão](#5-sessão)
6. [Estado do carrinho](#6-estado-do-carrinho)
7. [Cache, retries e sincronização](#7-cache-retries-e-sincronização)
8. [Reconciliação REST × Socket.IO](#8-reconciliação-rest--socketio)
9. [Mocks e cenários](#9-mocks-e-cenários)
10. [Testes e auditoria](#10-testes-e-auditoria)
11. [Decisões de UX](#11-decisões-de-ux)
12. [Desvios do Figma](#12-desvios-do-figma)
13. [Limitações conhecidas](#13-limitações-conhecidas)
14. [Registro de decisões](#14-registro-de-decisões)

## 1. Stack

| Papel              | Biblioteca                                                 |
| ------------------ | ---------------------------------------------------------- |
| UI                 | React 19, Tailwind CSS 4, shadcn/ui (Radix)                |
| Roteamento         | TanStack Router (file-based, ver ADR-001)                  |
| Estado de servidor | TanStack Query 5                                           |
| REST               | Axios (instância única em `src/infra/http/http-client.ts`) |
| Tempo real         | `socket.io-client` (somente transporte WebSocket)          |
| Mocks              | MSW 2 + `@mswjs/socket.io-binding`                         |
| Testes             | Playwright (Chromium desktop e mobile)                     |
| Auditoria          | Lighthouse                                                 |
| Build              | Vite 8, TypeScript 6 em modo `strict`                      |

Node: versão em `.nvmrc` (22 LTS).

## 2. Camadas e pastas

Clean Architecture: dependências apontam só para dentro. A regra é verificada pelo ESLint (`eslint-plugin-boundaries` + `no-restricted-imports`); violar a direção quebra o `npm run lint`.

```
src/
  domain/            Entidades, value objects e erros de negócio. TypeScript puro.
    entities/
    value-objects/   ex.: EthAmount (decimal em string, sem float), Quantity
    errors/
  application/       Casos de uso e as portas (interfaces) que eles exigem.
    use-cases/<contexto>/
    ports/           repositories/, gateways/, services/ (Clock, IdGenerator...)
    dtos/
    errors/          ApplicationError + códigos (VALIDATION, CONFLICT, ...)
  adapters/          Implementações das portas: repositórios HTTP, gateway de
    http/            eventos Socket.IO, mappers DTO ↔ entidade, tradução de erros.
    socket/
    mappers/
  infra/             Drivers: instância Axios, fábrica do socket, leitura de env.
    config/  http/  socket/
  main/              Composition root: factories de casos de uso, QueryClient,
    bootstrap/       router, providers e ativação dos mocks. Único lugar que
    providers/       instancia implementações concretas.
    factories/
  presentation/      React. Rotas finas, telas, componentes, hooks.
    routes/          arquivos de rota (TanStack Router) → ligam rota a tela
    screens/         uma tela por rota
    components/ui/   shadcn/ui adaptado aos tokens
    components/      componentes de produto compostos
    hooks/           hooks finos: useQuery/useMutation chamando casos de uso
    styles/          tokens do design system (globals.css)
  mocks/             MSW: handlers REST por recurso, servidor Socket.IO
    handlers/        simulado, banco em memória, fixtures e cenários.
    socket/  db/  scenarios/  services/  shims/
tests/
  unit/              Testes de domínio, casos de uso e adaptadores (fakes em memória).
  e2e/               Playwright (fluxos, falhas, tempo real, acessibilidade).
  support/           Fixtures, page objects e controle dos mocks.
scripts/             Lighthouse, relatório de bundle, variantes de imagem, shadcn.
assets/figma/        Originais exportados do Figma (fonte de `public/images`).
```

Dependências permitidas:

| Camada       | Pode importar                                            |
| ------------ | -------------------------------------------------------- |
| domain       | domain                                                   |
| application  | domain, application                                      |
| adapters     | domain, application, bibliotecas de transporte           |
| infra        | infra, bibliotecas de transporte                         |
| main         | todas                                                    |
| presentation | presentation, application (DTOs/tipos), main (factories) |
| mocks        | mocks, adapters (tipos de contrato)                      |

Regras práticas:

- Componentes não chamam Axios, socket nem MSW; falam com casos de uso por hooks.
- Valores ETH trafegam como string decimal e são operados por value object, nunca `number`.
- Erros de transporte viram `ApplicationError` em `src/adapters/http/http-error.mapper.ts`; a UI mapeia `code`/`reason` para mensagem.
- Componentes usam apenas tokens de `globals.css`: nada de cor, espaçamento ou raio soltos.

Modelagem do domínio: as entidades são tipos `readonly` serializáveis com regras em funções puras (`diffCart`, `reconcileOrder`, `isQuoteOutdated`...), e não classes com estado. Assim o mesmo objeto vai para o cache do TanStack Query, para o `localStorage` e para os eventos sem conversão, e o cache nunca guarda instâncias que se perdem na serialização. Conceitos com regra numérica usam value objects de verdade (`EthAmount` em `bigint`, `Quantity`). A apresentação recebe esses tipos por `@application/dtos`, que também expõe alguns predicados e validadores puros do domínio para feedback imediato na tela. Esses predicados nunca alteram estado, e toda escrita continua passando por caso de uso, que valida de novo.

## 3. Contratos REST

Base: `VITE_API_BASE_URL` (padrão `/api`). Tipos de transporte em `src/adapters/http/contracts.ts`, fonte única para os adaptadores Axios e para o servidor simulado. Valores ETH trafegam sempre como string decimal (`"1.19"`), nunca `number`.

Autenticação: `Authorization: Bearer <accessToken>`. Carrinho de visitante: cabeçalho `X-Guest-Cart-Id` (id gerado no navegador na primeira escrita).

| Recurso   | Método e caminho                   | Corpo / query                                                     | Resposta                     |
| --------- | ---------------------------------- | ----------------------------------------------------------------- | ---------------------------- |
| Conta     | `POST /auth/register`              | `{ name, email, password }`                                       | 201 `SessionDto`             |
|           | `POST /auth/login`                 | `{ email, password }`                                             | 200 `SessionDto`             |
|           | `POST /auth/refresh`               | `{ refreshToken }`                                                | 200 `SessionDto`             |
|           | `POST /auth/logout`                | —                                                                 | 204                          |
|           | `GET /auth/me`                     | —                                                                 | `UserDto`                    |
| NFTs      | `GET /nfts`                        | query abaixo                                                      | `PageDto<NftDto>`            |
|           | `GET /nfts/facets`                 | —                                                                 | `CatalogFacetsDto`           |
|           | `GET /nfts/:id`                    | —                                                                 | `NftDto` ou 404              |
| Favoritos | `GET /favorites`                   | —                                                                 | `{ items: FavoriteDto[] }`   |
|           | `PUT` / `DELETE /favorites/:nftId` | —                                                                 | 200 / 204                    |
| Carrinho  | `GET /cart`                        | —                                                                 | `CartDto`                    |
|           | `POST /cart/items`                 | `{ nftId, editionId, quantity }` (soma à linha existente)         | `CartDto`                    |
|           | `PATCH` / `DELETE /cart/items/:id` | `{ quantity }` (id = `nftId:editionId`)                           | `CartDto`                    |
|           | `PUT` / `DELETE /cart/coupon`      | `{ code }`                                                        | `CartDto`                    |
|           | `POST /cart/merge`                 | `{ guestCartId }` (autenticado)                                   | `CartDto`                    |
| Cotação   | `POST /quotes`                     | — (cotação do carrinho atual; substitui as anteriores do usuário) | 201 `QuoteDto` (10 min)      |
| Pedidos   | `POST /orders`                     | `Idempotency-Key` + `{ quoteId, collector, payment }`             | 201 `OrderDto` (pendente)    |
|           | `GET /orders/:id`                  | —                                                                 | `OrderDto` (403 se de outro) |
|           | `GET /orders/:id/receipt`          | —                                                                 | `ReceiptDto` ou 409          |
| Perfil    | `GET` / `PATCH /profile`           | `{ displayName, username, email, ensName, walletNickname }`       | `ProfileDto`                 |
|           | `PUT` / `DELETE /profile/avatar`   | `{ dataUrl }` (PNG/JPEG/WebP, até 512 KB) / — ("Remover")         | `ProfileDto`                 |
|           | `PUT /profile/password`            | `{ currentPassword, newPassword }`                                | 204                          |
| Carteiras | `GET /wallets`                     | —                                                                 | `{ items: WalletDto[] }`     |
|           | `PUT` / `DELETE /wallets/:slot`    | `SaveWalletRequest` (slot `primary` ou `secondary`)               | `WalletDto` / 204            |
|           | `POST /wallets/:slot/connect`      | `{ provider }` (conexão simulada; pode ser recusada)              | `WalletDto`                  |
|           | `POST /wallets/:slot/disconnect`   | —                                                                 | `WalletDto`                  |

### Pedido, perfil e carteira (premissas 23 e 24)

O formulário de pagamento do Figma entra inteiro no contrato: em vez de cortar campos, o pedido, o perfil e a carteira foram ampliados. Tudo é validado pela API simulada (`src/mocks/services/validation.ts` e `order-form.ts`), e erros voltam em `fieldErrors` com o caminho do campo (`collector.email`, `payment.address`).

| Tipo                | Campos                                                                                                                                                                                                            |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `CollectorDto`      | `displayName`, `username`, `profileName`, `email`, `ensName` (`algo.eth`), `referralCode` (`AAA-0000`), `note` (opcional)                                                                                         |
| `PaymentDto`        | `network` (`ethereum`, `polygon`, `solana`), `address` (EVM `0x` + 40 hex; Solana base58), `secondaryAddressOrEns` (opcional), `provider`, `walletId` (`primary`/`secondary` ou `null` em "Usar outra carteira?") |
| `provider`          | `metamask`, `walletconnect`, `coinbase` ("Tipo de carteira"; no recibo aparece como "Carteira")                                                                                                                   |
| `ProfileDto`        | `id`, `displayName`, `username`, `email`, `ensName`, `walletNickname`, `avatarUrl`, `updatedAt`                                                                                                                   |
| `SaveWalletRequest` | `nickname`, `displayName`, `profileName`, `email`, `ensName`, `referralCode`, `network`, `address`, `secondaryAddressOrEns`, `provider`                                                                           |
| `WalletDto`         | `SaveWalletRequest` + `slot`, `connected` (conexão simulada ativa), `updatedAt`                                                                                                                                   |

Com `walletId` preenchido, endereço e rede precisam ser os da carteira cadastrada (senão 422 em `payment.address`). `OrderDto` e `ReceiptDto` carregam `collector` e `payment` como snapshot: editar o perfil ou a carteira depois não altera um recibo emitido.

Query de `GET /nfts` (listas repetem a chave):

| Parâmetro              | Valores                                                                                                                                  |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `search`               | texto (nome, coleção, criador, descrição; sem acento e sem caixa)                                                                        |
| `collection`           | coleções do Figma: `arte-digital`, `fotografia`, `musica`, `arte-3d`, `colecionaveis`, `generativa`, `jogos`, `assinaturas`, `utilidade` |
| `network`              | `ethereum`, `polygon`, `solana`                                                                                                          |
| `minPrice`, `maxPrice` | ETH em string decimal; compara com o menor preço entre as edições disponíveis                                                            |
| `tab`                  | `todos` (padrão), `novos` (lançados desde 25/09/2026), `em-alta` (`trendingScore` ≥ 70)                                                  |
| `sort`                 | `recent`, `price-asc`, `price-desc`, `name-asc`; ausente = padrão da aba (`em-alta` ordena por tendência, as demais por recentes)        |
| `page`, `pageSize`     | inteiros; `pageSize` padrão 9 (grid 3×3), máximo 48                                                                                      |
| `featured`             | `true` = só destaques                                                                                                                    |

`NftDto` traz coleção, rede (`network`), criador, imagens, edições (`priceEth`, `compareAtPriceEth` para o preço riscado, `supply`, `available`), `featured`, `trendingScore`, `createdAt` e `version`. A versão cresce a cada mudança de preço ou estoque.

Formato de erro comum a todos os endpoints:

```json
{
  "message": "texto legível em pt-BR",
  "reason": "CODIGO_DE_NEGOCIO",
  "fieldErrors": { "campo": ["mensagem"] }
}
```

| HTTP         | `ApplicationError.code` | Uso                                                                                                                                                                                                                                                                            |
| ------------ | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 400 / 422    | `VALIDATION`            | campos inválidos (`fieldErrors`), cupom inválido ou expirado, falta de `Idempotency-Key`                                                                                                                                                                                       |
| 401          | `UNAUTHENTICATED`       | sessão ausente (`UNAUTHENTICATED`), token vencido (`TOKEN_EXPIRED`, renovável), sessão encerrada (`SESSION_EXPIRED`), credenciais erradas (`INVALID_CREDENTIALS`)                                                                                                              |
| 403          | `FORBIDDEN`             | recurso de outro usuário                                                                                                                                                                                                                                                       |
| 404          | `NOT_FOUND`             | recurso inexistente                                                                                                                                                                                                                                                            |
| 409          | `CONFLICT`              | estoque (`EDITION_SOLD_OUT`, `QUANTITY_EXCEEDS_AVAILABILITY`), cadastro (`EMAIL_IN_USE`), cotação (`QUOTE_OUTDATED`, `QUOTE_EXPIRED`), idempotência (`IDEMPOTENCY_KEY_REUSED`), recibo de pedido não confirmado (`ORDER_NOT_CONFIRMED`), carteira recusada (`WALLET_REJECTED`) |
| 408          | `TIMEOUT`               | tempo esgotado (o cliente aborta em 10 s)                                                                                                                                                                                                                                      |
| 429 / 5xx    | `TRANSIENT`             | falha transitória (pode repetir)                                                                                                                                                                                                                                               |
| sem resposta | `OFFLINE`               | sem conexão                                                                                                                                                                                                                                                                    |

A lista completa de `reason` está em `src/application/errors/error-reasons.ts`. Quando a resposta não traz `message`, o mapper usa um texto pt-BR por código, então `error.message` sempre pode ir direto para o usuário. A exceção é `CANCELED` (consulta obsoleta ou sessão encerrada), que a interface ignora.

### Pedido idempotente

1. A chave `Idempotency-Key` é gerada e guardada no navegador **antes** do envio, junto com o conteúdo (`CheckoutAttempt`, por usuário).
2. Mesma chave + mesmo conteúdo devolve o mesmo pedido (200, cabeçalho `Idempotent-Replayed: true`). Mesma chave + conteúdo diferente responde 409 `IDEMPOTENCY_KEY_REUSED`. A chave é checada antes de qualquer validação, então um pedido já criado sempre é recuperado.
3. Clique repetido, timeout e refresh reaproveitam a chave (`PlaceOrderUseCase`). Se a tentativa anterior ficou sem resposta e o conteúdo mudou, ela é reenviada primeiro. Se existir pedido pendente, ele é devolvido em vez de criar outro.
4. Após refresh ou reconexão, `ResumeCheckoutUseCase` recupera a compra em andamento sem criar pedido.
5. Antes de criar, o servidor confere se a cotação ainda bate com o carrinho (preço, estoque, cupom e taxa). Se não bater, responde 409 `QUOTE_OUTDATED`; a interface revalida (`RevalidateQuoteUseCase`) e exige nova confirmação.
6. O pedido nasce `pending`. A simulação de pagamento confirma ou recusa e emite `order.updated`. Confirmado e recusado são finais. Recibo e tela de confirmação só existem para pedido confirmado (verificado no caso de uso e no servidor). A confirmação baixa o estoque e tira do carrinho só os itens e quantidades comprados; a recusa não toca no carrinho.

## 4. Contratos de eventos (Socket.IO)

Tipos em `src/adapters/socket/contracts.ts`. Servidor → cliente:

| Evento          | Recurso | Alcance                          | Payload                     |
| --------------- | ------- | -------------------------------- | --------------------------- |
| `nft.updated`   | `nft`   | todas as conexões (público)      | `NftDto` completo e atual   |
| `order.updated` | `order` | só as conexões do dono do pedido | `OrderDto` completo e atual |

Envelope: `{ eventId, type, resource: { type, id }, version, occurredAt, payload }`. O `eventId` é estável: um reenvio chega com o mesmo id. `version` é a versão do recurso após a mudança. Eventos malformados, ou com `payload.id` diferente de `resource.id`, são descartados pelo mapper.

Identificação da sessão: o token de acesso vai na query do handshake (`?token=`). Sem token = visitante, que recebe só eventos públicos. Cada sessão abre a própria conexão (`forceNew`); ao trocar de usuário ou sair, a anterior é fechada com todos os listeners removidos.

Transporte: `socket.io-client` conecta somente por WebSocket (`transports: ['websocket']`), interceptado pelo MSW (`ws.link`) e decodificado por `@mswjs/socket.io-binding`. O handshake Engine.IO/Socket.IO é respondido pelo binding, e o servidor simulado envia o ping do Engine.IO a cada 20 s. O `engine.io-client` guarda a referência a `WebSocket` quando o módulo é avaliado, por isso o `socket.io-client` é importado sob demanda na primeira conexão (`loadSocketClient` em `src/infra/socket/socket-client.ts`), sempre depois de o MSW iniciar.

Inicialização (`src/main/index.tsx`): shell, MSW e a tela da rota de entrada (Início ou detalhe, `preload-entry-route.ts`) são baixados em paralelo. O shell é montado assim que chega, sem esperar o MSW, e todo o tráfego da API fica retido até os mocks estarem interceptando (`src/infra/network/network-gate.ts`: interceptor do Axios e `loadSocketClient` esperam a mesma promessa). Os loaders das rotas de Início e detalhe fazem prefetch das consultas (`src/main/query/catalog-queries.ts`, fonte única das opções usadas também pelos hooks), então os dados saem assim que a rede é liberada, sem esperar a tela renderizar. No detalhe, quando o dado chega, o loader também faz preload da imagem principal (`preloadNftImage`, com o mesmo `srcset` AVIF e o mesmo `sizes` da galeria, `NFT_DETAIL_IMAGE_SIZES`), para que ela comece a baixar antes da renderização; o preload por hover (`preload: true`) não dispara imagem.

Reconexão do cliente: atraso de 1 s a 5 s entre tentativas, sem limite de tentativas. Três falhas seguidas mudam o status para "Sem conexão" (`FAILED_ATTEMPTS_BEFORE_OFFLINE`).

## 5. Sessão

- **Estado:** `SessionState` (`src/application/services/session-state.ts`) é a fonte única da sessão em memória, observável e com notificação síncrona.
- **Persistência:** a sessão (tokens e usuário) fica no `localStorage` (`LocalSessionStorage`). `RestoreSessionUseCase` a recupera antes do primeiro render e descarta sessões com refresh vencido.
- **Renovação:** o interceptor Axios anexa o token. Em 401 `TOKEN_EXPIRED`, renova uma vez e repete a requisição. Renovações simultâneas compartilham a mesma chamada (`RefreshSessionUseCase`).
- **Expiração:** um 401 definitivo (`SESSION_EXPIRED`) ou refresh recusado encerra a sessão com `endedReason: 'expired'`. A interface leva ao login com retorno ao contexto. O carrinho fica no servidor e a tentativa de compra fica no navegador, então nada se perde.
- **Logout e troca de usuário:** `startSessionRuntime` (`src/main/session/session-runtime.ts`) reage à mudança de usuário antes de qualquer render. Ele fecha a conexão em tempo real, cancela e remove todo o cache `['private', ...]` e as mutations em andamento, descarta o carrinho de visitante e abre a conexão da nova sessão.
- **Respostas atrasadas:** o interceptor registra de qual usuário é cada requisição autenticada e descarta (`CANCELED`) a resposta que chega depois de a sessão mudar, para que dado de um usuário nunca entre no cache de outro.
- **Rotas privadas:** o layout `_autenticado` usa `requireAuth` (`src/presentation/navigation/require-auth.ts`) no `beforeLoad`. Sem sessão, leva a `/login?redirect=<rota atual>` e acrescenta `expired=1` quando a sessão expirou, para o aviso "Sua sessão expirou". O `redirect` só aceita caminho interno (`safeRedirectPath`), evitando redirecionamento para fora da aplicação. O router é invalidado a cada troca de usuário, então uma tela privada aberta vai sozinha ao login quando a sessão expira.
- **Expiração no checkout:** o rascunho do pagamento (coletor, carteira e rede) fica no `sessionStorage` (`useCheckoutDraft`) e volta após o login; o carrinho está no servidor. O rascunho é limpo quando o pedido é criado.

## 6. Estado do carrinho

- O carrinho vive no servidor (estado simulado persistido), por isso sobrevive a refresh. O visitante é identificado por `X-Guest-Cart-Id`; o usuário, pela sessão.
- Ao entrar ou se cadastrar, `MergeGuestCartUseCase` leva os itens do visitante para o usuário, somando quantidades até o limite do estoque. Se falhar, a mescla é tentada de novo na próxima leitura do carrinho.
- Subtotal, desconto, taxa de rede e total vêm sempre da API; o cliente não recalcula. Taxa: 0,0015 ETH + 0,0004 ETH por unidade. Cupons de teste: `JUNGLE10` (10%), `ETH005` (0,005 ETH) e `EXPIRADO20` (expirado).
- Quantidade é inteira e validada contra o estoque no cliente (`Quantity`) e no servidor.
- Mudanças de preço ou estoque com o carrinho aberto chegam por `nft.updated`, recarregam o carrinho e viram avisos (`useCartChanges`, calculados por `diffCart`). No checkout, `useIsQuoteOutdated` bloqueia o envio de uma cotação que deixou de bater com o carrinho.

## 7. Cache, retries e sincronização

Padrões em `src/main/query-client.ts`:

| Item                    | Política                                                                                                                                                                                                                       |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `staleTime`             | 30 s para dados públicos; facets 5 min; recibo `Infinity` (snapshot)                                                                                                                                                           |
| `gcTime`                | 5 min                                                                                                                                                                                                                          |
| Retry de consultas      | até 2 tentativas, somente erros `TRANSIENT`, `TIMEOUT`, `OFFLINE`; backoff exponencial (500 ms → 4 s)                                                                                                                          |
| Retry de mutations      | desligado; reenvio de pedido só com a mesma chave de idempotência                                                                                                                                                              |
| Refetch ao focar janela | desligado (o tempo real atualiza o cache)                                                                                                                                                                                      |
| Pedido pendente         | consulta a cada 4 s enquanto `pending`, como rede de segurança além do evento                                                                                                                                                  |
| Cancelamento            | todo gateway repassa o `AbortSignal` do Query ao Axios; trocar de filtro aborta a consulta anterior                                                                                                                            |
| Chaves de consulta      | `src/main/query/query-keys.ts`: públicas sob `['catalog', ...]` (com todos os parâmetros da busca); privadas sob `['private', userId, ...]`; visitante sob `['guest', ...]`; query privada sem sessão usa `['inactive', nome]` |

As mutations do carrinho gravam a resposta da API direto no cache. O favorito usa atualização otimista com rollback (`useToggleFavorite`): a lista muda na hora e, se a API falhar, volta ao estado anterior e a falha fica disponível para a interface avisar.

Search params do Início (TanStack Router, `parseCatalogSearch` em `validateSearch`): `q`, `collection`, `network`, `min`, `max`, `tab`, `sort`, `page`. Valores padrão não aparecem na URL. Listas repetem a chave e valores ficam em texto (`?collection=arte-digital&network=solana&tab=novos&min=0.5&page=2`), pelo serializador em `src/main/search-serializer.ts`. Mudar filtro, busca, aba ou ordenação volta para a página 1 (`applyCatalogFilters`).

## 8. Reconciliação REST × Socket.IO

1. **Uma geração por sessão:** `RealtimeSync` (`src/application/services/realtime-sync.ts`) abre a conexão da sessão com um `RealtimeEventFilter` novo. Eventos de gerações anteriores são ignorados mesmo que cheguem atrasados.
2. **Duplicados e antigos:** o filtro descarta `eventId` já visto e versão menor ou igual à última aplicada ao mesmo recurso.
3. **Aplicação no cache** (`QueryCacheRealtimeSink`): `nft.updated` substitui o NFT no detalhe, nas listas, nos destaques e nos favoritos, só se a versão for maior, e recarrega o carrinho que contém o NFT. `order.updated` passa por `reconcileOrder`: sem regressão de versão e com estados finais imutáveis.
4. **REST não regride evento:** as consultas de detalhe do NFT e do pedido comparam a versão recebida com a do cache e mantêm a mais nova.
5. **Reconexão:** ao reconectar, catálogo, carrinho de visitante e todo o cache privado do usuário são invalidados (consultas ativas recarregam). Mudanças ocorridas durante a queda chegam pelo REST.
6. **Status:** `useRealtimeIndicator()` expõe o status (`connecting`, `connected`, `reconnecting`, `disconnected`) e o texto da premissa 20: "Reconectando" nas primeiras falhas e "Sem conexão" a partir da terceira falha seguida, com as tentativas continuando ao fundo. Em `io server disconnect`, caso em que o Socket.IO não reconecta sozinho, o gateway chama `connect()` de novo.

## 9. Mocks e cenários

- **Ativação:** `VITE_ENABLE_MOCKS=true`. O modo `mock` do Vite (`.env.mock`) é usado por `npm run dev` e `npm run build`, portanto o build de demonstração já sai com os mocks.
- **Worker:** `public/mockServiceWorker.js` é gerado por `msw init` e iniciado em paralelo com o primeiro render (`src/main/bootstrap/enable-mocks.ts`); nenhuma requisição da aplicação sai antes de ele estar pronto (ver §4, Inicialização). Ao terminar, marca `<html data-mocks="ready">`. O código do MSW fica num chunk separado, carregado só quando os mocks estão ativos.
- **Estado:** um único banco em memória (`src/mocks/db/database.ts`) serve catálogo, favoritos, carrinho, cotação, pedidos, perfil e carteiras, persistido no `localStorage`. O reset restaura as fixtures. Toda mudança gera a resposta REST e o evento correspondente.
- **Fixtures:** 54 NFTs (6 por coleção do Figma), 3 redes, preços de 0,02 a 12,30 ETH, edições esgotadas e preço riscado. A página 1 em "Listados recentemente" traz os 9 cards do Figma. Há 2 usuários com senha guardada como hash SHA-256 com sal: `alex@jungle.test` / `Jungle@123` (com carteira) e `bia@jungle.test` / `Jungle@456`. Os ids estáveis para testes estão em `src/mocks/db/fixture-ids.ts`.
- **Cenários** (`src/mocks/scenarios/scenarios.ts`): `success`, `empty`, `latency-fixed`, `latency-variable` (semente fixa), `out-of-order`, `offline`, `server-error`, `timeout`, `session-expired`, `unauthorized`, `register-conflict`, `validation-error`, `coupon-invalid`, `coupon-expired`, `price-changed`, `edition-sold-out`, `order-timeout-after-create`, `payment-confirmed`, `payment-rejected`, `wallet-rejected`. Gatilhos como preço alterado e timeout após criar disparam uma vez por ativação, então o mesmo cenário repetido dá o mesmo resultado.
- **Seleção pela URL:** `?scenario=`, `?latency=`, `?paymentDelay=`, `?accessTtl=`, `?seed=` e `?mockReset=1`. A escolha fica guardada até ser trocada ou resetada.
- **Controle** (mesma origem, JSON, chamado de dentro da página; nunca pela interface do produto):

| Endpoint                          | Corpo                                                                  | Efeito                                                     |
| --------------------------------- | ---------------------------------------------------------------------- | ---------------------------------------------------------- |
| `GET /__mock/state`               | —                                                                      | configuração, conexões abertas, último `eventId`, cenários |
| `POST /__mock/reset`              | `{ scenario?, latencyMs?, paymentDelayMs?, accessTokenTtlMs?, seed? }` | restaura banco e configuração, derruba sockets             |
| `POST /__mock/scenario`           | idem                                                                   | troca o cenário e zera contadores                          |
| `POST /__mock/fail`               | `{ method?, path, status, reason?, count }`                            | as próximas `count` requisições ao caminho falham          |
| `POST /__mock/events/nft-updated` | `{ nftId, editionId?, priceEth?, available? }`                         | altera o banco e emite `nft.updated`                       |
| `POST /__mock/events/resend-last` | —                                                                      | reenvia o último evento (mesmo `eventId`)                  |
| `POST /__mock/events/stale`       | `{ nftId, priceEth }`                                                  | emite evento com versão anterior                           |
| `POST /__mock/socket/disconnect`  | `{ downForMs? }`                                                       | derruba as conexões e recusa reconexão pelo período        |
| `POST /__mock/sessions/expire`    | —                                                                      | revoga todas as sessões abertas                            |

## 10. Testes e auditoria

### Unidade (`npm run test:unit`)

Configuração em `playwright.unit.config.ts`: runner do Playwright no Node, sem navegador nem servidor, com `tsconfig.unit.json` resolvendo os aliases de camada. Os testes em `tests/unit/` usam fakes em memória das portas (`tests/unit/support/fakes.ts`). Cobrem entidades e value objects (`EthAmount`, `Quantity`, `reconcileOrder`, `diffQuotes`, `isQuoteOutdated`, `diffCart`, carteira), `PlaceOrderUseCase` e `ResumeCheckoutUseCase` (idempotência), `RefreshSessionUseCase`, `RealtimeEventFilter`, `RealtimeSync`, os interceptors de sessão e os search params do catálogo.

### Playwright (`npm run test:e2e`)

Configuração em `playwright.config.ts`.

| Item                  | Valor                                                                                                       |
| --------------------- | ----------------------------------------------------------------------------------------------------------- |
| Servidor              | `webServer` roda `npm run build && npm run preview`: build de demonstração com MSW ativo, porta 4173        |
| Projetos              | `chromium-desktop` (1440×900) e `chromium-mobile` (Pixel 7 com viewport 390×844)                            |
| Ambiente do navegador | `pt-BR`, fuso `America/Sao_Paulo`, `reducedMotion: 'reduce'`, service workers permitidos                    |
| Retries               | 1 local, 2 em CI (`forbidOnly` em CI)                                                                       |
| Evidências            | trace `on-first-retry`, screenshot só na falha, relatório HTML em `playwright-report/`                      |
| Isolamento            | cada teste abre contexto novo do navegador (armazenamento vazio) e a fixture `mock` reseta o banco simulado |

Helpers em `tests/support/`:

- `test.ts`: `test`/`expect` do projeto. A fixture `mock` reseta o cenário. A opção `clockAt` instala o relógio controlado do Playwright (`page.clock`) antes da navegação, com `FIXED_NOW` como referência fixa.
- `mock-control.ts`: `MockControl` controla o servidor simulado de dentro da página: escolhe e reseta cenários, programa falhas e latência, dispara eventos Socket.IO. As chamadas saem da própria página, pois só elas passam pelo service worker do MSW.
- `visual.ts`: `prepareForScreenshot` estabiliza a página antes da captura (animações zeradas, fontes carregadas, imagens decodificadas).
- `test-data.ts`: reexporta os identificadores das fixtures dos mocks, para que os testes não dupliquem dados.

Regressão visual: `toHaveScreenshot` com animações desligadas, cursor oculto, escala CSS e tolerância de 1% de pixels. As baselines ficam em `tests/e2e/__screenshots__/<projeto>/<arquivo>/<nome>-<plataforma>.png`, separadas por plataforma porque a renderização de fontes muda entre sistemas: Windows (máquina de desenvolvimento) e Linux (imagem oficial do Playwright em Docker), para que o avaliador possa rodar em qualquer um dos dois. As baselines são geradas com `npm run test:e2e -- --update-snapshots`, e a plataforma de cada uma fica registrada no README.

### Lighthouse (`npm run lighthouse`)

Script em `scripts/lighthouse.mjs`, configuração versionada em `scripts/lighthouse.config.mjs`.

| Item                 | Valor                                                                                                                                                                |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Alvo                 | build de produção (`npm run build`, mocks ativos) servido por `vite preview`, no cenário padrão dos mocks                                                            |
| Páginas              | início (`/`) e detalhe do NFT (`/nfts/$nftId`, com um id das fixtures)                                                                                               |
| Perfis               | mobile (padrão do Lighthouse) e desktop (`desktopConfig`)                                                                                                            |
| Medições             | 3 por página e perfil, cada uma com perfil novo do Chromium do Playwright; vale a execução mediana (`computeMedianRun`)                                              |
| Categorias e metas   | Performance ≥ 90, Accessibility ≥ 95, Best Practices ≥ 95, SEO ≥ 90                                                                                                  |
| Métricas registradas | LCP, CLS, TBT, além de FCP e Speed Index                                                                                                                             |
| Saída                | HTML e JSON de todas as execuções, `summary.json` e `summary.md` com notas, métricas, versões, ambiente (SO, CPU, memória, BenchmarkIndex) e condições de throttling |

Opções: `--skip-build` reaproveita o `dist/`; `--assert` termina com código 1 se alguma mediana ficar abaixo da meta.

Rodadas de trabalho vão para `lighthouse-reports/`, que é ignorado pelo Git. Só a rodada final da entrega é versionada, em `docs/auditoria/lighthouse/`, e resultados abaixo da meta são justificados lá.

Variação entre execuções no mobile: o Lighthouse simula a rede a partir dos bytes de cada requisição, e as que passam pelo service worker do MSW chegam com tamanho de transferência 0. Na primeira visita, o worker assume o controle da página por volta do momento em que a fonte e alguns arquivos são pedidos; quando assume um pouco depois, esses arquivos entram com o tamanho real. Para a meta não depender desse acaso, o caminho até o LCP foi reduzido ao necessário: as imagens do diário e das promoções só baixam perto da tela (`defer-render`, `content-visibility: auto`; o Chrome antecipava imagens lazy a até ~3000 px), o Toaster e o sonner só carregam depois do `load` ou no primeiro aviso, e a fonte foi reduzida para 22 KB. Nas 18 execuções mobile das rodadas de 27/10, o pior caso (fonte com tamanho real) ficou em 90, e as demais em 91 (Início) e 92 (detalhe).

## 11. Decisões de UX

- **Busca** aplica no Enter (sem debounce): uma consulta por intenção, URL previsível. Mantém os demais filtros e volta à página 1.
- **Filtros** (Coleções, Rede) aplicam ao marcar; a **faixa de preço** só aplica no "Aplicar", como no Figma. Toda mudança de filtro, aba ou ordenação volta para a página 1 e preserva a posição de rolagem.
- **Abas** (Todos os NFTs, Novos lançamentos, Em alta) são `role=tab` ligadas ao search param `tab`.
- **Troca de página/filtro** mantém a lista anterior visível com opacidade reduzida (`aria-busy`) até a nova chegar; o primeiro carregamento usa skeleton com as mesmas dimensões dos cards.
- **Estados**: vazio ("Nenhum NFT encontrado" + "Limpar filtros"), erro (`role=alert` + "Tentar novamente"), NFT inexistente ("NFT não encontrado" + "Voltar ao catálogo"), rota inexistente (404 no mesmo padrão).
- **Comprar NFT** adiciona ao carrinho e segue para ele; o botão de ícone "Adicionar ao carrinho" adiciona e confirma por toast com "Ver carrinho". A quantidade é limitada à disponibilidade da edição e acompanha reduções recebidas em tempo real.
- **Favoritar** é um toggle (`aria-pressed`) otimista; visitante vai ao login com retorno para a página atual.
- **Fora do escopo** (Criadores, Aprenda, "Ler mais" do diário, links institucionais do rodapé, newsletter): itens visíveis, desabilitados com "Em breve" ou, no caso da newsletter, toast informando que o cadastro não está disponível. Nada simula sucesso.
- **Navegação mobile** (< 768 px): sem cabeçalho, como no Figma; busca + botão "Filtros" (drawer inferior com filtros e ordenação) no topo do Início e tab bar inferior (Início, Favoritos, atalho central para o catálogo, Carrinho, Perfil). No detalhe a tab bar dá lugar à barra de compra fixa do Figma.
- **Pagamento em etapas na mesma tela** (premissa 23): o botão diz "Revisar pedido" até haver cotação; na revisão o formulário e "Seus NFTs" travam (com o resumo do que será enviado e "Editar dados") e o botão vira "Confirmar compra". Confirmar revalida a cotação: se algo mudou, um alerta lista as diferenças e só a próxima confirmação envia. Mudança em tempo real depois da revisão troca o botão por "Revisar novamente". Pendente, recusado e esgotado aparecem como alertas no próprio resumo; confirmado leva ao recibo. Timeout após criar (premissa 25): o cliente reenvia sozinho com a mesma chave e recupera o mesmo pedido, anunciando "A confirmação demorou. Recuperando seu pedido…" em região viva; "Tentar novamente" só aparece se essa recuperação também falhar.
- **Carteira no pagamento**: escolher um cartão de provedor ("Tipo de carteira") conecta a carteira cadastrada escolhida pela simulação; recusa mostra alerta e "Conectar carteira"; conectada mostra "Desconectar carteira". Com "Usar outra carteira?" endereço e rede são digitados e não há conexão. Nome ENS é digitado sem o sufixo; o ".eth" fixo entra no valor enviado. O primeiro campo inválido recebe o foco.
- **Perfil**: um único "Salvar" grava os dados e, se algum campo de "Alterar senha" foi preenchido, a senha em seguida; tudo é validado antes do primeiro envio. Avatar é gravado ao escolher o arquivo (prévia imediata; tipo e tamanho conferidos antes do envio) e "Remover" volta ao ícone. Resultado anunciado em região `status`.
- **Carteiras**: carteira nova começa com nome, e-mail, ENS e apelido do perfil. "Igual à carteira principal" copia e trava os dados de colecionador e o tipo; apelido, rede e endereço continuam próprios. No pagamento, clicar no cartão do provedor já marcado conecta a carteira; "Revisar pedido" fica desabilitado enquanto a carteira escolhida não estiver conectada.
- **Menu "Meu perfil"**: abaixo de 1024 px vira faixa rolável acima do conteúdo; itens fora do escopo ficam visíveis com "Em breve".
- **768–1023 px**: cabeçalho desktop com a navegação em drawer ("Abrir menu"); busca + botão "Filtros" (drawer) no lugar da sidebar, que aparece a partir de 1024 px.

## 12. Desvios do Figma

| Onde                           | Figma                                           | Implementação                                                             | Motivo                                                             |
| ------------------------------ | ----------------------------------------------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| Tipografia                     | ~60 combinações de tamanho/altura de linha      | Escala consolidada em 15 tokens (`--text-*` em `globals.css`)             | Manutenção; diferenças de 1–4 px de altura de linha                |
| Filtros (Coleções, Rede)       | Item selecionado só muda de cor                 | Cor de destaque + ícone de check                                          | Estado não pode depender só da cor (R72)                           |
| Texto de erro                  | `Color/Error` `#ED1B2E`                         | `Text/Coral` `#F0805F` para texto; vermelho só em borda/ícone             | Contraste AA sobre `Ink`                                           |
| Edições no detalhe             | Pílulas "1/1", "1/10", "1/50", "ABERTA"         | Pílula com nome da edição + tiragem ("Padrão 1/50"); esgotada riscada     | Os dados têm edições nomeadas; nome necessário para leitor de tela |
| Avaliações                     | "4.8 (19)" e aba "Avaliações de colecionadores" | Omitidas                                                                  | Fora do escopo do enunciado; sem dados                             |
| Compartilhar                   | Ícones "Compartilhar este NFT"                  | Omitidos                                                                  | Fora do escopo                                                     |
| Botões do detalhe              | Desktop: "COMPRAR" + "Favoritar"                | "COMPRAR" + ícone "Adicionar ao carrinho" + "Favoritar"                   | R03 exige adicionar ao carrinho sem sair da página                 |
| Hero                           | Pontos decorativos                              | Pontos são botões que alternam entre até 3 NFTs em destaque               | Dá função ao elemento                                              |
| Imagens                        | 4 artes PNG 1254×1254                           | Mesmas artes em AVIF/WebP/JPEG responsivos (`assets/figma` como fonte)    | Peso: ~16 KB (AVIF 640) contra ~2 MB do PNG; mesmo visual          |
| Login mobile                   | "Novo na Kurio? Crie uma conta"                 | "Novo na Kurio? Criar conta"                                              | Mesmo nome do link no desktop e nos testes (premissa 17)           |
| Login social / senha           | Botões Google, Facebook e "Esqueceu a senha?"   | Visíveis, desabilitados e marcados "Em breve"                             | Fora do escopo; não podem aparentar sucesso (R12, premissa 22)     |
| Cores Google/Facebook          | Estilos "Logo" do arquivo                       | Cores oficiais publicadas pelas marcas                                    | Figma inacessível no momento; registrado em `design-system.md`     |
| Ícones de redes/carteira       | Glifos do arquivo                               | Glifos SVG simplificados em `social-icons.tsx`; Lucide nos demais         | Assets ainda não exportados                                        |
| Pagamento: carteira cadastrada | Só no mobile ("Carteira conectada")             | Grupo "Carteira conectada" também no desktop, acima de "Tipo de carteira" | H11.1 exige escolher a carteira cadastrada; o desktop não tem onde |
| Pagamento: "Tipo de carteira"  | Select no formulário + cartões no resumo        | Só os cartões do resumo, com o nome "Tipo de carteira"                    | Um controle por valor; os cartões disparam a conexão (premissa 23) |
| Pagamento: revisão             | Só "Confirmar compra"                           | "Revisar pedido" → revisão travada → "Confirmar compra"                   | R24/R26: revalidação antes de confirmar (premissa 23)              |
| Recibo: mobile                 | Sem frame                                       | Mesmo card em largura total                                               | Premissa 6                                                         |
| Recibo: desconto               | Só "Taxa de rede" e "Total"                     | "Desconto do lançamento" aparece quando houver cupom                      | O total precisa fechar com o que foi cobrado                       |
| Indicadores de página          | Pontos de 7–8 px com 6 px entre eles            | Mesmos pontos dentro de alvos de 24 px (~24 px entre centros)             | Tamanho mínimo de alvo de toque (WCAG 2.5.8)                       |
| Tablet (768–1023)              | Sem frame                                       | Composição desktop; navegação e filtros em drawer                         | Frame inexistente; segue a composição mais próxima sem overflow    |

## 13. Limitações conhecidas

- O `@mswjs/socket.io-binding` não implementa rooms, namespaces nem broadcast; a simulação usa o namespace padrão e emite para a conexão de cada sessão.
- O MSW intercepta apenas WebSocket, por isso o cliente Socket.IO não usa long-polling.
- O registry do shadcn/ui está publicando alguns componentes com `import { cn } from "cn"`. Use `npm run ui:add -- <componente>`, que corrige o import para `@presentation/lib/utils`.
- O binding não lê o pacote `auth` do Socket.IO, então o token de acesso vai na query do handshake. Num servidor real ele iria em `auth` e não ficaria na URL.
- O servidor simulado aceita no socket qualquer token de acesso já emitido para uma sessão viva, inclusive os anteriores à última renovação, para que a reconexão não dependa do token corrente.
- Durante a queda simulada do socket (`/__mock/socket/disconnect` ou cenário `offline`), a conexão é recusada lançando erro no handler do MSW, que é o que faz o cliente reagendar a tentativa. O MSW registra esse erro no console.
- O pagamento é resolvido por temporizador na página. Se a página recarregar com pedido pendente, ele é liquidado no carregamento seguinte (os testes controlam o tempo com `page.clock`).
- O hash de transação e os links de exploração (Etherscan, Polygonscan, Solscan) são simulados: o link abre o explorador real, que não encontra a transação.
- No bundle dos mocks, o pacote `tough-cookie` é trocado por `src/mocks/shims/tough-cookie.ts` (alias em `vite.config.ts`). O MSW só o usa no próprio cookie jar, que guarda cookies definidos por respostas simuladas (`Set-Cookie`); ele e o `tldts` (Public Suffix List, ~110 KB gzip) pesavam no caminho crítico. O substituto é um jar sempre vazio. Como a API simulada não usa cookies (a sessão vai em `Authorization`), o comportamento não muda, e os cookies de `document.cookie` continuam chegando aos handlers. O chunk do MSW caiu de 173 para 58 KB gzip. Limitação: um handler que defina cookie por `Set-Cookie` não o verá nas requisições seguintes.
- Fonte: a interface usa a face latin do Roboto Mono variável com o eixo de peso limitado a 400–700 (`src/presentation/styles/fonts/`, gerada por `npm run fonts:subset`), 22 KB em vez de 33 KB. As faces latin-ext, cirílica e grega do pacote não são declaradas; um caractere fora do `unicode-range` latin usa a fonte de fallback de `--font-sans`. Um peso abaixo de 400 seria aproximado pelo 400.
- Lighthouse mobile do Início (R82): a mediana atinge a meta (91), mas execuções isoladas variam entre 89 e 91. A causa é a corrida descrita em §10. Na primeira visita, o service worker do MSW assume o controle da página por volta do momento em que a fonte (22 KB) é pedida. Quando assume antes, a fonte passa por ele, e o Lighthouse a conta com 0 bytes; quando assume depois, ela entra com o tamanho real. Medições de 27/10, 4 rodadas com build novo e mediana de 3: Início mobile 91/91/91/91 nas medianas, e nas 12 execuções dez 91, um 90 e um 89 (os dois com a fonte em tamanho real); detalhe mobile 92 em todas; desktop 100. Registrar o worker mais cedo deixaria todas as execuções iguais às boas, mas só porque o Lighthouse zera o que passa pelo worker: o usuário real baixa os mesmos bytes. Por isso não foi feito. A fonte é necessária ao primeiro texto, e cortá-la mais exigiria trocar a tipografia do Figma. Uma rodada com duas das três execuções no pior caso pode fechar a mediana em 89 ou 90.
- `npm audit`: nenhuma vulnerabilidade em dependências de produção (`npm audit --omit=dev`). As 29 restantes (19 moderadas e 10 altas) vêm só do `lighthouse` 12, ferramenta de auditoria usada em desenvolvimento, por meio de `@sentry/node`/OpenTelemetry e `puppeteer-core` (proxy-agent, basic-ftp, extract-zip, zod). Nenhuma entra no bundle nem no deploy. A correção exige subir o `lighthouse` para a versão 13 (major), o que fica para a revisão do script de auditoria.

## 14. Registro de decisões

| ADR                                                       | Assunto                              |
| --------------------------------------------------------- | ------------------------------------ |
| [ADR-001](docs/decisoes/ADR-001-roteamento-file-based.md) | TanStack Router com rotas file-based |
