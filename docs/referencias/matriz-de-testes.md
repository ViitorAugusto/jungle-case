# Matriz requisito → teste

Liga cada requisito de [requisitos](requisitos.md) à verificação que o cobre. Specs em `tests/e2e/`, executadas em `chromium-desktop` (1440×900) e `chromium-mobile` (390×844) contra o build de demonstração com MSW. Auditoria de performance em `scripts/lighthouse.mjs`.

Status: **pendente** (spec planejada), **parcial** (spec existe e cobre parte), **ok** (verde nos dois projetos), **revisão** (verificado por inspeção de código/documento, não por E2E).

## Infraestrutura de teste

| Item | Onde |
| --- | --- |
| Configuração | `playwright.config.ts` |
| `test` do projeto, relógio controlado (`clockAt`) | `tests/support/test.ts` |
| Controle do servidor simulado (cenário, reset, falhas, eventos, socket, sessões) | `tests/support/mock-control.ts` → endpoints `/__mock/*` |
| Preparação para regressão visual | `tests/support/visual.ts` |
| Identificadores das fixtures | `tests/support/test-data.ts` → `src/mocks/db/fixture-ids.ts` |
| Baselines visuais | `tests/e2e/__screenshots__/<projeto>/<spec>/` |
| Lighthouse (páginas, perfis, execuções, metas) | `scripts/lighthouse.config.mjs` |

## Testes exigidos (§9)

| Código | Cobertura | Spec | Status |
| --- | --- | --- | --- |
| T01 | Busca, filtros combinados, ordenação, paginação, histórico | `catalogo.spec.ts` | pendente |
| T02 | Acesso direto ao detalhe e recurso inexistente | `detalhe.spec.ts` | pendente |
| T03 | Cadastro, login, expiração de sessão, logout, troca de usuário | `conta-sessao.spec.ts` | pendente |
| T04 | Favoritos com falha de mutation e recuperação | `favoritos.spec.ts` | pendente |
| T05 | Carrinho, quantidades, remoção, cupom, persistência após refresh/login | `carrinho.spec.ts` | pendente |
| T06 | Compra completa do catálogo ao recibo confirmado | `compra.spec.ts` | pendente |
| T07 | Falha de pagamento, clique repetido, timeout com recuperação do mesmo pedido | `pagamento-falhas.spec.ts` | pendente |
| T08 | Perfil, avatar, senha e carteiras com erros de validação | `perfil-carteiras.spec.ts` | pendente |
| T09 | Preço/disponibilidade via Socket.IO durante o checkout | `tempo-real-checkout.spec.ts` | pendente |
| T10 | Eventos duplicados ou antigos, desconexão, retomada de pedido pendente | `tempo-real-eventos.spec.ts` | pendente |
| T11 | Teclado, foco de diálogos, validação de formulários | `acessibilidade.spec.ts` | pendente |
| T12 | Skeleton em carregamento lento, feedback de falha, nova tentativa | `estados-carregamento.spec.ts` | pendente |
| R76 **E** | Mocks, desktop e mobile, estado isolado, relógio/latência/eventos controlados | `smoke.spec.ts` + fixtures de `tests/support` | parcial |
| R77 | Regressão visual de início, detalhe, carrinho e pagamento | `visual.spec.ts` | pendente |
| R78 | Relatório HTML, traces das falhas; tempo real pelo cliente Socket.IO e REST pelo MSW | `playwright.config.ts` (`playwright-report/`, trace na 1ª nova tentativa) | parcial |

## Requisitos de produto cobertos por E2E

| Código | Spec | Status |
| --- | --- | --- |
| R02 | `catalogo.spec.ts`, `visual.spec.ts` | pendente |
| R03 | `detalhe.spec.ts`, `visual.spec.ts` | pendente |
| R04 | `carrinho.spec.ts`, `visual.spec.ts` | pendente |
| R05 | `compra.spec.ts`, `visual.spec.ts` | pendente |
| R06 | `compra.spec.ts` | pendente |
| R07 | `conta-sessao.spec.ts` | pendente |
| R08 | `conta-sessao.spec.ts` | pendente |
| R09 | `perfil-carteiras.spec.ts` | pendente |
| R10 | `perfil-carteiras.spec.ts` | pendente |
| R11 | `visual.spec.ts` (390 e 1440), `perfil-carteiras.spec.ts` e `compra.spec.ts` no projeto mobile | pendente |
| R12 | `app-shell.spec.ts` (links fora do escopo não aparentam sucesso) | pendente |
| R13 | `catalogo.spec.ts` | pendente |
| R14 | `catalogo.spec.ts` | pendente |
| R15 | `catalogo.spec.ts` (cenários `empty`, `server-error`, `out-of-order`) | pendente |
| R16 | `detalhe.spec.ts` (`nft-999`, edição esgotada, limite de quantidade) | pendente |
| R17 | `favoritos.spec.ts` | pendente |
| R18 | `carrinho.spec.ts` | pendente |
| R19 | `carrinho.spec.ts` | pendente |
| R20 | `carrinho.spec.ts` (`coupon-invalid`, `coupon-expired`) | pendente |
| R21 | `carrinho.spec.ts` | pendente |
| R22 | `tempo-real-checkout.spec.ts` | pendente |
| R23 | `carrinho.spec.ts` (valores exibidos iguais aos da API) | pendente |
| R24 | `compra.spec.ts`, `acessibilidade.spec.ts` | pendente |
| R25 | `compra.spec.ts` (`wallet-rejected`, desconexão) | pendente |
| R26 | `tempo-real-checkout.spec.ts` (`price-changed`, `edition-sold-out`) | pendente |
| R27 | `pagamento-falhas.spec.ts` (clique repetido, `order-timeout-after-create`) | pendente |
| R28 | `pagamento-falhas.spec.ts`, `tempo-real-eventos.spec.ts` | pendente |
| R29 **E** | `compra.spec.ts`, `pagamento-falhas.spec.ts` (`payment-rejected` não mostra confirmação) | pendente |
| R30 | `pagamento-falhas.spec.ts`, `compra.spec.ts` | pendente |
| R31 | `compra.spec.ts` | pendente |
| R32 | `conta-sessao.spec.ts` | pendente |
| R33 | `conta-sessao.spec.ts` (acesso direto a rotas privadas) | pendente |
| R34 | `conta-sessao.spec.ts` (`session-expired`, `/__mock/sessions/expire`, relógio) | pendente |
| R35 **E** | `conta-sessao.spec.ts` (logout e troca alex → bia sem dado anterior) | pendente |
| R36 | `perfil-carteiras.spec.ts` (`validation-error`, refresh) | pendente |
| R37 | `conta-sessao.spec.ts` (senha ausente do armazenamento local) | pendente |
| R40 | `estados-carregamento.spec.ts` | pendente |
| R41 | `favoritos.spec.ts`, `carrinho.spec.ts`, `tempo-real-eventos.spec.ts` | pendente |
| R42 | `catalogo.spec.ts` (`out-of-order`) | pendente |
| R43 | `catalogo.spec.ts`, `conta-sessao.spec.ts` | pendente |
| R44 | `pagamento-falhas.spec.ts`, `estados-carregamento.spec.ts` | pendente |
| R45 | `app-shell.spec.ts`, `detalhe.spec.ts` | parcial |
| R46 | `favoritos.spec.ts` (falha programada em `/favorites`, rollback) | pendente |
| R50 | `pagamento-falhas.spec.ts` | pendente |
| R52 | `smoke.spec.ts` (reset), `carrinho.spec.ts` (refresh) | parcial |
| R53 | `estados-carregamento.spec.ts` (`latency-fixed`, `offline`, `timeout`, `server-error`) | pendente |
| R55 | specs de cada cenário listadas acima | pendente |
| R56 **E** | `tempo-real-*.spec.ts` (eventos chegam pelo `socket.io-client`) | pendente |
| R57 | `smoke.spec.ts` (build de demonstração com mocks), `tempo-real-checkout.spec.ts` (REST e evento coerentes) | parcial |
| R58 | `tempo-real-checkout.spec.ts` (catálogo, detalhe, carrinho) | pendente |
| R59 | `tempo-real-eventos.spec.ts` | pendente |
| R60 | `tempo-real-eventos.spec.ts` (`resend-last`, `stale`) | pendente |
| R61 | `tempo-real-eventos.spec.ts` (`socket/disconnect`) | pendente |
| R62 **E** | `tempo-real-eventos.spec.ts` (troca de usuário com pedido pendente) | pendente |
| R63 | `tempo-real-checkout.spec.ts` | pendente |
| R64 | `tempo-real-eventos.spec.ts` | pendente |
| R65 | `visual.spec.ts` | pendente |
| R66 | `visual.spec.ts` (390 e 1440; 768 em verificação de overflow) | pendente |
| R67 | `estados-carregamento.spec.ts` (dimensões do skeleton, movimento reduzido) | pendente |
| R68 | `acessibilidade.spec.ts` | pendente |
| R69 | `acessibilidade.spec.ts` (diálogos e drawer mobile) | pendente |
| R70 | `acessibilidade.spec.ts` | pendente |
| R71 | `acessibilidade.spec.ts` | pendente |
| R72 | `acessibilidade.spec.ts` + Lighthouse Accessibility | pendente |
| R73 | `acessibilidade.spec.ts` (regiões `status`/`alert`) | pendente |
| R74 | `acessibilidade.spec.ts` (sem rolagem horizontal em 390/768/1440 e zoom 200%) | pendente |
| R84 | `smoke.spec.ts` contra a URL pública (`baseURL` por variável) | pendente |

## Lighthouse (§10)

| Código | Verificação | Status |
| --- | --- | --- |
| R79 | `npm run lighthouse`: build de produção, `/` e `/nfts/nft-002`, mobile e desktop, cenário padrão | pendente |
| R80 | Metas em `scripts/lighthouse.config.mjs`; `--assert` falha abaixo da meta | pendente |
| R81 | 3 execuções por página/perfil, mediana (`computeMedianRun`), HTML/JSON de cada execução, `summary.json`/`summary.md` com versões, ambiente e condições | pendente |
| R82 | LCP, CLS e TBT (e FCP, SI) no resumo; justificativa no `ARCHITECTURE.md` quando abaixo | pendente |

## Verificados por revisão

| Código | Como |
| --- | --- |
| R01 **E** | Revisão de dependências e uso efetivo de cada biblioteca |
| R38, R39, R47, R48, R49 | Revisão de código e do `ARCHITECTURE.md` |
| R51 | Busca por respostas fictícias fora de `src/mocks` |
| R54 | Revisão de `src/mocks/db/fixtures.ts` |
| R75 | Revisão de `public/` e do `ARCHITECTURE.md` |
| R83, R85–R88 | Checklist de entrega a partir de checkout limpo |
