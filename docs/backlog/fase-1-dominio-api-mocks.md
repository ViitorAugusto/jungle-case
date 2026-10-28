# Fase 1 — Domínio, contratos e mocks

Objetivo: toda tela da F2 em diante consome dados reais da API simulada, sem nenhum dado fictício fora da camada de rede (R51).

## Épico E1 — Domínio e contratos

### H1.1 Modelo de domínio (Must, M)

*Como time, queremos entidades tipadas para que transporte, estado e interface falem a mesma língua (R39).*

- Entidades: Usuário, Sessão, NFT (com edições e disponibilidade por edição), Favorito, Carrinho/Item, Cotação, Cupom, Pedido (pendente/confirmado/recusado), Recibo, Perfil, Carteira (principal/secundária, rede).
- **Dado** um valor em ETH, **então** ele é `string` decimal em todo o caminho e as contas usam aritmética decimal, sem `number` de ponto flutuante (R23).
- **Dado** uma quantidade, **então** é inteira e validada contra a disponibilidade da edição.

### H1.2 Contratos REST (Must, M)

*Como time, queremos os contratos documentados para que mocks, adaptadores e testes usem a mesma fonte (R48).*

- Endpoints para sessão/conta, NFTs (lista com busca, filtros, ordenação e paginação; detalhe), favoritos, carrinho, cotação, pedidos (criação com `Idempotency-Key`; consulta de estado e recibo), perfil (dados, avatar, senha) e carteiras.
- Formato único de erro cobrindo validação (422), sessão inválida (401), sem permissão (403), inexistente (404), conflito de disponibilidade/cadastro/idempotência (409) e falha transitória (5xx/timeout) (R49).
- Contratos descritos no `ARCHITECTURE.md`.

### H1.3 Contratos de eventos (Must, P)

- `nft.updated` e `order.updated` com `eventId` estável, recurso afetado, `version` e payload (R60).
- Eventos privados (pedido) só chegam ao dono da sessão (R62).

## Épico E2 — Adaptadores

### H2.1 Cliente HTTP (Must, M)

- Instância Axios única com base URL, token da sessão, cancelamento (AbortSignal do Query) e normalização do erro para o formato de domínio (R38, R42).
- Política de retry: só GET e falhas transitórias; mutation de pedido só reenvia com a mesma chave de idempotência (R44, R47).

### H2.2 Cliente Socket.IO (Must, M)

- `socket.io-client` real, conectado por sessão; ao trocar de usuário/logout desconecta e remove listeners (R35, R62).
- Ignora `eventId` já visto e `version` menor ou igual à aplicada (R60).
- Ao reconectar, reconcilia por REST os recursos ativos (R61).

## Épico E3 — API simulada (MSW)

### H3.1 Banco simulado com estado consistente (Must, G)

- Um único estado em memória com persistência local (para sobreviver a refresh) compartilhado por catálogo, favoritos, carrinho, perfil, carteiras e pedidos (R52).
- Fixtures com variedade para filtros e paginação (sugestão: 40+ NFTs, várias coleções, categorias, faixas de preço, edições esgotadas) e pelo menos 2 usuários com senha guardada como hash (R37, R54).
- Reset restaura integralmente o cenário conhecido (R52).

### H3.2 Cenários configuráveis (Must, G)

*Como avaliador, quero escolher um cenário e reproduzir a falha quando quiser (R53, R55).*

- Seleção por parâmetro de URL e/ou painel de cenários fora do layout principal, documentados no README (R85).
- Cenários: sucesso; vazio; latência fixa e variável; respostas fora de ordem; sem conexão; 4xx/5xx; sessão expirada; não autorizado; conflito de cadastro; erro de validação; cupom inválido; cupom expirado; preço alterado; edição esgotada; timeout após criar pedido; pagamento confirmado; pagamento recusado.
- **Dado** o mesmo cenário, **quando** repito o fluxo, **então** o resultado é o mesmo (determinístico).

### H3.3 Pedido idempotente (Must, M)

- **Dado** uma criação de pedido com chave K, **quando** reenvio com K e o mesmo conteúdo, **então** recebo o mesmo pedido (R50).
- **Quando** reenvio K com conteúdo diferente, **então** 409.
- **Dado** o cenário "timeout após criar", **então** o pedido existe no servidor simulado e o reenvio o recupera (R27).
- Pagamento confirma ou recusa conforme o cenário, emitindo `order.updated` (R59).

### H3.4 Eventos pelo MSW (Must, G)

- Socket.IO simulado com `@mswjs/socket.io-binding` (ou equivalente compatível com o protocolo), exercitando o `socket.io-client` (R56).
- Mudanças no estado simulado (preço, disponibilidade, pedido) geram a resposta REST e o evento correspondente (R57).
- Gatilhos de evento controláveis pelo cenário/teste (preço muda, duplicado, antigo, desconexão), nunca pela UI (eliminatório).
- Transporte e limitações documentados no `ARCHITECTURE.md`.

### H3.5 Mocks no build de demonstração (Must, P)

- Ativados por `VITE_ENABLE_MOCKS`, funcionando no deploy público (R57, R84).

Status: concluída e aceita (typecheck, lint, build e testes unitários verdes; revisão de arquitetura aprovada).
