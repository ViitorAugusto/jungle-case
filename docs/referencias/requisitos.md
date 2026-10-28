# Requisitos do enunciado

Fonte: [junglegaming/frontend-challenge](https://github.com/junglegaming/frontend-challenge) (README). Cada requisito tem um código usado no backlog e na matriz de testes. A seção do enunciado aparece entre parênteses.

Legenda: **E** = eliminatório se não atendido.

## Stack (§2)

| Código | Requisito |
| --- | --- |
| R01 **E** | React + TypeScript com uso efetivo de TanStack Router, TanStack Query, Axios, REST, Socket.IO, Tailwind CSS, shadcn/ui, MSW, Playwright e Lighthouse |

## Telas (§3)

| Código | Tela | Obrigatório |
| --- | --- | --- |
| R02 | Início | Destaques, catálogo, busca, filtros, ordenação, navegação para o NFT |
| R03 | Detalhes do NFT | Galeria, informações, edição, quantidade, favoritos, compra |
| R04 | Carrinho | Quantidades, remoção, cupom, resumo de valores |
| R05 | Pagamento | Dados do colecionador, carteira e rede, revisão, envio do pedido |
| R06 | Confirmação | Resultado, identificação da transação, itens, taxas, total |
| R07 | Login | Autenticação, validação, retorno ao fluxo anterior |
| R08 | Cadastro | Criação de conta, validação, conflito |
| R09 | Perfil | Edição de dados, avatar, alteração de senha |
| R10 | Carteiras | Cadastro e edição de carteira principal e secundária |
| R11 | Responsivo | Frames desktop e mobile do Figma; perfil, carteiras e confirmação também em mobile |
| R12 | Fora de escopo coerente | Editorial, suporte, atividade, ofertas, downloads não entram; ações fora do escopo não aparentam sucesso |

## Catálogo e detalhe (§3)

| Código | Requisito |
| --- | --- |
| R13 | Busca, filtros, ordenação e paginação na URL; sobrevivem a refresh e histórico |
| R14 | Filtros combináveis; mudar filtro volta para a página 1 |
| R15 | Consultas refletem os parâmetros enviados; vazio, falha e respostas fora de ordem tratados |
| R16 | Detalhe com acesso direto, NFT inexistente, edição indisponível e limite de quantidade |
| R17 | Favoritos persistem para o usuário autenticado |

## Carrinho (§3)

| Código | Requisito |
| --- | --- |
| R18 | Adicionar, alterar e remover respeitando disponibilidade por NFT e edição |
| R19 | Carrinho mantido após refresh; itens do visitante preservados ao autenticar |
| R20 | Aplicar e remover cupom; código inválido ou expirado tratado |
| R21 | Subtotal, desconto, taxa de rede e total coerentes com a API |
| R22 | Mudança de preço/disponibilidade refletida com o carrinho aberto |
| R23 | ETH em string decimal com precisão; quantidade inteira; cotação da API é a referência |

## Pagamento e confirmação (§3)

| Código | Requisito |
| --- | --- |
| R24 | Validação dos campos do layout e revisão antes do envio |
| R25 | Carteiras cadastradas, seleção de rede, simulação de conexão, recusa e desconexão |
| R26 | Revalidar preço, disponibilidade, cupom e taxas antes de confirmar; mudança exige nova confirmação |
| R27 | Sem pedido duplicado em clique repetido ou reenvio após timeout |
| R28 | Pedido pendente, confirmado e recusado, com recuperação após refresh ou reconexão |
| R29 **E** | Confirmação só para pedido confirmado pela simulação |
| R30 | Falha preserva itens; confirmação remove só os itens e quantidades comprados |
| R31 | Recibo é snapshot do pedido; transação e links de exploração simulados |

## Conta e sessão (§3)

| Código | Requisito |
| --- | --- |
| R32 | Cadastro, login, logout e sessão integrados à API simulada |
| R33 | Checkout, perfil, carteiras, favoritos e pedidos exigem autenticação |
| R34 | Sessão recuperável após refresh; expiração na navegação e no checkout preservando contexto |
| R35 **E** | Logout e troca de usuário limpam cache privado e subscriptions anteriores |
| R36 | Validação de cadastro, perfil, senha e carteiras, incluindo erros da API; alterações persistem após refresh |
| R37 | Credenciais fictícias; senha nunca armazenada em claro |

## Integração e estado (§4)

| Código | Requisito |
| --- | --- |
| R38 | Router nas rotas, search params e proteção de rotas privadas; Query em consultas, mutations e cache; REST só via Axios |
| R39 | Contratos tipados entre transporte, estado e interface |
| R40 | Estados de carregamento, vazio, erro, sucesso e atualização em segundo plano |
| R41 | Invalidação coerente após mutations e eventos |
| R42 | Cancelamento ou descarte de respostas obsoletas |
| R43 | Isolamento de dados por usuário e por parâmetros da consulta |
| R44 | Recuperação de falhas sem duplicar operações |
| R45 | Rota inexistente tratada; acesso direto a qualquer tela |
| R46 | Atualização otimista com rollback em pelo menos uma interação |
| R47 | Política de cache, retries e sincronização documentada |

## Contratos REST (§5)

| Código | Requisito |
| --- | --- |
| R48 | Recursos: sessão/conta, NFTs, favoritos, carrinho, cotação, pedidos, perfil, carteiras — contratos documentados |
| R49 | Erros: validação, sessão inválida, sem permissão, inexistente, conflito de disponibilidade, falha transitória |
| R50 | Pedido com chave de idempotência; mesma tentativa recupera o mesmo pedido; mesma chave com conteúdo diferente = conflito |

## Mocks com MSW (§6)

| Código | Requisito |
| --- | --- |
| R51 | Mocks na camada de rede, reutilizados em dev, demo e testes; nada de resposta fictícia em componentes, hooks ou Axios |
| R52 | Estado consistente entre catálogo, favoritos, carrinho, perfil, carteiras e pedidos; persistência local permitida; reset restaura cenário conhecido |
| R53 | Condições de rede configuráveis e reproduzíveis: lentidão, latência variável, timeout, sem conexão, HTTP de erro |
| R54 | Fixtures suficientes para filtros e paginação; pelo menos dois usuários |
| R55 | Cenários determinísticos: sucesso/vazio; latência e fora de ordem; conexão e 4xx/5xx; sessão expirada e não autorizado; conflito de cadastro/validação; cupom inválido/expirado; preço alterado/edição esgotada; timeout pós-criação com idempotência; pagamento confirmado/recusado |
| R56 **E** | Eventos via MSW compatível com Socket.IO (ex.: @mswjs/socket.io-binding) exercitando `socket.io-client`; transporte e limitações documentados |
| R57 | Mocks ativados por configuração e disponíveis no build de demonstração; mudança nos dados reflete em REST e eventos |

## Tempo real (§7)

| Código | Requisito |
| --- | --- |
| R58 | `nft.updated` atualiza preço e disponibilidade em catálogo, detalhe e carrinho |
| R59 | `order.updated` atualiza o estado do pedido e mostra confirmação ou recusa |
| R60 | Eventos com identidade estável, recurso e versão; duplicados e antigos ignorados sem regredir estado |
| R61 | Reconciliação com REST após reconexão |
| R62 **E** | Eventos de sessão anterior não atualizam dados de outro usuário; listeners liberados no fim do ciclo de vida |
| R63 | Cenário: NFT no carrinho → preço/disponibilidade muda → interface avisa e atualiza resumo → checkout bloqueia cotação desatualizada |
| R64 | Queda de conexão com pedido pendente: recuperar ao reconectar ou recarregar sem nova compra; confirmado e recusado são terminais |

## Interface e acessibilidade (§8)

| Código | Requisito |
| --- | --- |
| R65 | Tipografia, cores, espaçamentos, hierarquia, imagens, proporções e composição do Figma; shadcn adaptado à identidade |
| R66 | Desktop, tablet e mobile; validar 390, 768 e 1440 px |
| R67 | Skeleton com shimmer em catálogo, detalhe e resumo do carrinho; dimensões preservadas; respeita movimento reduzido |
| R68 | Teclado e foco visível |
| R69 | Foco controlado em diálogos e drawers |
| R70 | Semântica, labels e erros associados aos campos |
| R71 | Texto alternativo em imagens relevantes |
| R72 | Contraste legível; estados não só por cor |
| R73 | Feedback acessível para mutations e atualizações em tempo real |
| R74 | Sem overflow horizontal nem perda de conteúdo com zoom |
| R75 | Assets do Figma usados e disponíveis localmente; substituições e ajustes de acessibilidade documentados |

## Testes Playwright (§9)

| Código | Cobertura |
| --- | --- |
| T01 | Busca, filtros combinados, ordenação, paginação, restauração pelo histórico |
| T02 | Acesso direto ao detalhe e recurso inexistente |
| T03 | Cadastro, login, expiração de sessão, logout, troca de usuário |
| T04 | Favoritos com falha de mutation e recuperação |
| T05 | Carrinho, quantidades, remoção, cupom, persistência após refresh/login |
| T06 | Compra completa do catálogo ao recibo confirmado |
| T07 | Falha de pagamento, clique repetido, timeout com recuperação do mesmo pedido |
| T08 | Perfil, avatar, senha e carteiras com erros de validação |
| T09 | Preço/disponibilidade via Socket.IO durante o checkout |
| T10 | Eventos duplicados ou antigos, desconexão, retomada de pedido pendente |
| T11 | Teclado, foco de diálogos, validação de formulários |
| T12 | Skeleton em carregamento lento, feedback de falha, recuperação após nova tentativa |
| R76 **E** | Testes executáveis com os mocks; Chromium desktop e mobile; estado isolado por teste; relógio, latência e eventos controlados |
| R77 | Regressão visual de início, detalhe, carrinho e pagamento com baselines versionadas |
| R78 | Relatório HTML e traces das falhas; tempo real pelo cliente Socket.IO e REST pelos handlers MSW |

## Lighthouse (§10)

| Código | Requisito |
| --- | --- |
| R79 | Início e detalhe, mobile e desktop, build otimizado, cenário padrão dos mocks |
| R80 | Metas: Performance ≥ 90, Accessibility ≥ 95, Best Practices ≥ 95, SEO ≥ 90 |
| R81 | Três medições por página e perfil, mediana; configuração versionada; relatórios HTML/JSON, versões, ambiente e condições |
| R82 | LCP, CLS e TBT registrados; resultado abaixo da meta justificado; sem simplificação só para pontuar |

## Entrega (§12)

| Código | Requisito |
| --- | --- |
| R83 | Código, lockfile, assets, mocks, fixtures, testes e configurações de auditoria |
| R84 | Deploy público (Vercel recomendado) com mocks e tempo real funcionando; acesso direto e refresh de rotas |
| R85 | README: setup, variáveis de ambiente, credenciais fictícias, seleção e reset de cenários, comandos, como reproduzir falhas |
| R86 | ARCHITECTURE.md: contratos REST e eventos, sessão, carrinho, cache, reconciliação REST × Socket.IO, limitações, decisões de UX, desvios do Figma |
| R87 | Comandos: dev com mocks, build, preview, typecheck, lint, Playwright, Lighthouse |
| R88 | Executa de checkout limpo, sem serviço privado |

## Pontuação (§11)

| Critério | Pontos | Requisitos principais |
| --- | ---: | --- |
| Fidelidade visual e responsividade | 20 | R02–R11, R65–R67, R75 |
| Fluxos e experiência de uso | 20 | R13–R37 |
| Integração e estado | 15 | R38–R50 |
| Tempo real | 10 | R58–R64 |
| Mocking | 10 | R51–R57 |
| Testes | 10 | T01–T12, R76–R78 |
| Acessibilidade | 5 | R68–R74 |
| Performance | 5 | R79–R82 |
| Arquitetura e documentação | 5 | R47, R85–R88 |
