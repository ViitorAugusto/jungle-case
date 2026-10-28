# NFT Marketplace

Marketplace de NFTs em React + TypeScript com TanStack Router, TanStack Query, Axios, Socket.IO, Tailwind CSS e shadcn/ui. A API REST e os eventos em tempo real são simulados com MSW na camada de rede, inclusive no build de demonstração: não há serviço externo para subir. Arquitetura, contratos REST e de eventos, sessão, carrinho, cache, reconciliação, decisões de UX e desvios do Figma estão em [ARCHITECTURE.md](ARCHITECTURE.md).

## Requisitos

- Node 22 LTS (versão em `.nvmrc`; com nvm: `nvm use`)
- npm 10+

## Setup

A partir de um checkout limpo:

```bash
npm ci                             # instala as dependências do lockfile
npx playwright install chromium    # só para testes e Lighthouse
npm run dev                        # http://localhost:5173 com mocks ativos
```

Nenhum `.env` precisa ser criado: `npm run dev` e `npm run build` usam o modo `mock` (`.env.mock`, versionado).

## Comandos

| Comando                 | O que faz                                                                                            |
| ----------------------- | ---------------------------------------------------------------------------------------------------- |
| `npm run dev`           | servidor de desenvolvimento com mocks (MSW), porta 5173                                              |
| `npm run build`         | gera as rotas, verifica tipos e faz o build de demonstração (mocks ativos) em `dist/`                |
| `npm run preview`       | serve o `dist/` em http://localhost:4173                                                             |
| `npm run typecheck`     | gera as rotas e verifica tipos                                                                       |
| `npm run lint`          | ESLint, incluindo a regra de dependência entre camadas                                               |
| `npm run test:unit`     | testes unitários de domínio, casos de uso e adaptadores (Node, sem navegador)                        |
| `npm run test:e2e`      | testes Playwright (Chromium desktop e mobile) contra o build de demonstração                         |
| `npm run lighthouse`    | auditoria Lighthouse (início e detalhe, mobile e desktop, mediana de 3); `--skip-build` e `--assert` |
| `npm run bundle:report` | tamanho do caminho crítico por rota, com e sem mocks (bruto e gzip); `--skip-build`, `--json`        |
| `npm run images:nfts`   | regera as variantes AVIF/WebP/JPEG das artes a partir de `assets/figma/nfts`                         |
| `npm run fonts:subset`  | regera a fonte da interface (Roboto Mono, pesos 400–700) a partir do pacote `@fontsource`            |

Auxiliares: `npm run format` / `format:check` (Prettier), `npm run ui:add -- <componente>` (adiciona componente shadcn/ui), `npm run dev:api` / `build:api` (sem mocks, contra uma API real em `VITE_API_BASE_URL`).

`test:e2e` sobe sozinho o build e o preview na porta 4173 (a porta precisa estar livre). Relatório em `playwright-report/`. As capturas de regressão visual são por plataforma (sufixo `-win32` ou `-linux` no nome do arquivo); para regerar no seu sistema: `npm run test:e2e -- --update-snapshots`.

## Variáveis de ambiente

Exemplo comentado em `.env.example`. O modo `mock` (`.env.mock`) é usado por `dev` e `build`.

| Variável            | Padrão  | Uso                                                |
| ------------------- | ------- | -------------------------------------------------- |
| `VITE_ENABLE_MOCKS` | `true`  | liga o MSW (REST e Socket.IO simulados)            |
| `VITE_API_BASE_URL` | `/api`  | base da API REST                                   |
| `VITE_SOCKET_URL`   | (vazio) | servidor Socket.IO; vazio = mesma origem da página |

## Credenciais fictícias

| Usuário    | E-mail             | Senha        | Observação                                                    |
| ---------- | ------------------ | ------------ | ------------------------------------------------------------- |
| Alex Rocha | `alex@jungle.test` | `Jungle@123` | perfil completo e carteira principal (Ethereum, MetaMask)     |
| Bia Lima   | `bia@jungle.test`  | `Jungle@456` | sem carteira nem ENS: exercita o cadastro de carteira do zero |

As senhas ficam guardadas como hash SHA-256 com sal no estado simulado. Também é possível criar uma conta em "Criar conta".

Cupons: `JUNGLE10` (10%), `ETH005` (0,005 ETH) e `EXPIRADO20` (expirado). Dados de pagamento válidos: código de indicação `JNG-2026`, ENS `nome.eth`, endereço EVM `0x` + 40 hexadecimais (ex.: `0x1111111111111111111111111111111111111111`).

## Cenários e reset dos mocks

O estado simulado (catálogo, carrinho, favoritos, pedidos, perfil, carteiras e sessões) persiste no navegador entre recarregamentos. Cenário e reset são escolhidos pela URL, em qualquer página:

| Parâmetro            | Efeito                                                            |
| -------------------- | ----------------------------------------------------------------- |
| `?mockReset=1`       | restaura o banco simulado às fixtures e derruba as conexões       |
| `?scenario=<id>`     | ativa um cenário (fica guardado até ser trocado ou resetado)      |
| `?latency=<ms>`      | latência base das respostas (padrão 120 ms)                       |
| `?paymentDelay=<ms>` | tempo até o pagamento simulado ser resolvido (padrão 2 s)         |
| `?accessTtl=<ms>`    | validade do token de acesso (padrão 15 min; exercita a renovação) |
| `?seed=<n>`          | semente da latência variável (padrão 42)                          |

Exemplo: `http://localhost:5173/?mockReset=1&scenario=payment-rejected`. Para voltar ao normal: `?mockReset=1&scenario=success`.

Os 20 cenários:

| Id                           | O que acontece                                                                 |
| ---------------------------- | ------------------------------------------------------------------------------ |
| `success`                    | tudo funciona (padrão)                                                         |
| `empty`                      | catálogo vazio                                                                 |
| `latency-fixed`              | todas as respostas levam 1,5 s                                                 |
| `latency-variable`           | latência entre 0,2 s e 2 s, sempre na mesma sequência (semente)                |
| `out-of-order`               | a listagem alterna resposta lenta e rápida: a anterior chega depois da nova    |
| `offline`                    | sem conexão (REST e Socket.IO)                                                 |
| `server-error`               | catálogo responde 503                                                          |
| `timeout`                    | catálogo não responde até o cliente desistir (10 s)                            |
| `session-expired`            | sessões abertas antes da ativação expiram (sem renovação)                      |
| `unauthorized`               | recursos privados respondem 403                                                |
| `register-conflict`          | cadastro responde e-mail em uso (409)                                          |
| `validation-error`           | cadastro, perfil, senha e carteiras respondem erro de validação (422)          |
| `coupon-invalid`             | qualquer cupom é inválido                                                      |
| `coupon-expired`             | qualquer cupom está expirado                                                   |
| `price-changed`              | logo após a cotação, o preço do primeiro item sobe 10% (evento em tempo real)  |
| `edition-sold-out`           | ao enviar o pedido, a edição do primeiro item esgota (409)                     |
| `order-timeout-after-create` | o primeiro pedido é criado mas a resposta se perde; o reenvio recupera o mesmo |
| `payment-confirmed`          | pagamento confirmado                                                           |
| `payment-rejected`           | pagamento recusado                                                             |
| `wallet-rejected`            | conexão de carteira recusada                                                   |

Gatilhos de uso único (preço alterado, edição esgotada, timeout após criar) disparam uma vez por ativação. Reativar o cenário (`?scenario=<id>` de novo) rearma o gatilho, e o mesmo fluxo dá o mesmo resultado.

**Endpoints de controle** (usados pelos testes; chamados de dentro da página, por exemplo no console do navegador, porque só a página passa pelo service worker):

```js
await fetch('/__mock/socket/disconnect', { method: 'POST', body: JSON.stringify({ downForMs: 5000 }) })
```

`POST /__mock/reset`, `POST /__mock/scenario`, `POST /__mock/fail`, `POST /__mock/events/nft-updated`, `POST /__mock/events/resend-last`, `POST /__mock/events/stale`, `POST /__mock/socket/disconnect`, `POST /__mock/sessions/expire` e `GET /__mock/state`. Corpos e efeitos em [ARCHITECTURE.md §9](ARCHITECTURE.md#9-mocks-e-cenários).

## Como reproduzir cada falha

Comece de `?mockReset=1&scenario=<id>` e siga os passos. Fluxos de compra exigem login (Alex já tem carteira).

| Falha                            | Cenário / gatilho                                     | Passos e resultado esperado                                                                                                                                                            |
| -------------------------------- | ----------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Catálogo vazio                   | `empty`                                               | Abra o Início: "Nenhum NFT encontrado" com "Limpar filtros"                                                                                                                            |
| Carregamento lento               | `latency-fixed` / `latency-variable`                  | Navegue pelo catálogo e detalhe: skeletons, lista anterior esmaecida durante a troca                                                                                                   |
| Respostas fora de ordem          | `out-of-order`                                        | Troque de filtro ou página rapidamente: a lista final corresponde sempre ao último filtro                                                                                              |
| Sem conexão                      | `offline`                                             | Abra qualquer página: alerta com "Tentar novamente" e status "Sem conexão" do tempo real                                                                                               |
| Erro do servidor                 | `server-error`                                        | Abra o Início: alerta de erro com "Tentar novamente" (após as novas tentativas automáticas)                                                                                            |
| Timeout                          | `timeout`                                             | Abra o Início: depois de 10 s, erro de tempo esgotado com "Tentar novamente"                                                                                                           |
| Sessão expirada                  | `session-expired` (ou `POST /__mock/sessions/expire`) | Entre na conta, depois ative o cenário: ao acessar área privada, login com "Sua sessão expirou" e retorno à página                                                                     |
| Não autorizado                   | `unauthorized`                                        | Entre e abra Favoritos, Perfil ou um pedido: mensagem de acesso negado                                                                                                                 |
| E-mail em uso                    | `register-conflict`                                   | "Criar conta" com qualquer e-mail: erro no campo E-mail                                                                                                                                |
| Erro de validação do servidor    | `validation-error`                                    | Salve perfil, senha ou carteira (ou crie conta): erros por campo vindos da API, foco no primeiro                                                                                       |
| Cupom inválido / expirado        | `coupon-invalid` / `coupon-expired` (ou `EXPIRADO20`) | Aplique um cupom no carrinho: mensagem no campo do cupom, total inalterado                                                                                                             |
| Preço alterado                   | `price-changed`                                       | Adicione um NFT, vá ao pagamento, clique "Revisar pedido" e aguarde 1 s: aviso "mudou" e botão "Revisar novamente"                                                                     |
| Edição esgotada                  | `edition-sold-out`                                    | Revise e clique "Confirmar compra": alerta "esgotou"; o carrinho mostra a disponibilidade                                                                                              |
| Timeout após criar o pedido      | `order-timeout-after-create`                          | Confirme a compra: aparece "A confirmação demorou. Recuperando seu pedido…" e o mesmo pedido é recuperado sozinho, sem duplicar; "Tentar novamente" só aparece se a recuperação falhar |
| Pagamento confirmado             | `payment-confirmed`                                   | Confirme a compra: pendente por 2 s, depois recibo com hash de transação                                                                                                               |
| Pagamento recusado               | `payment-rejected`                                    | Confirme a compra: alerta de recusa; o carrinho continua intacto                                                                                                                       |
| Carteira recusada                | `wallet-rejected`                                     | No pagamento, escolha um "Tipo de carteira": alerta de recusa e "Conectar carteira"                                                                                                    |
| Queda do tempo real              | `POST /__mock/socket/disconnect` (`downForMs`)        | Status "Reconectando" e depois "Sem conexão"; ao voltar, reconecta e recarrega catálogo, carrinho e pedidos                                                                            |
| Evento duplicado ou antigo       | `POST /__mock/events/resend-last` / `events/stale`    | Nada muda na tela: o cliente descarta `eventId` repetido e versão antiga                                                                                                               |
| Mudança de preço/estoque ao vivo | `POST /__mock/events/nft-updated`                     | Com `{ nftId, priceEth }` ou `{ nftId, available: 0 }`: detalhe, catálogo e carrinho atualizam e o carrinho mostra o aviso com o nome                                                  |
| Renovação silenciosa             | `?accessTtl=5000`                                     | Entre e espere mais de 5 s: a próxima requisição renova o token sem sair da conta                                                                                                      |
