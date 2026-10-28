# Fase 6 — Qualidade e entrega

Objetivo: tudo o que o avaliador vai abrir funciona de primeira, a partir de um checkout limpo.

## Épico E16 — Testes

### H16.1 Cobertura completa (Must, G)

- T01 a T12 verdes em Chromium desktop e mobile, com estado isolado por teste (R76).
- Regressão visual de Início, Detalhe, Carrinho e Pagamento com baselines Windows e Linux (R77).
- Relatório HTML e traces de falha (R78).

### H16.2 Acessibilidade (Must, M)

- Revisão por teclado de todas as telas, foco em diálogos e drawers, zoom de 200% sem perda de conteúdo (R68–R74). Teste: T11.

## Épico E17 — Auditoria

### H17.1 Lighthouse final (Must, M)

- Início e Detalhe, mobile e desktop, 3 execuções, mediana, relatórios HTML/JSON em `docs/auditoria/lighthouse/` (R79–R81).
- LCP, CLS e TBT registrados; resultado abaixo da meta tem causa explicada (R82).

## Épico E18 — Documentação e publicação

### H18.1 README (Must, P)

- Setup, variáveis de ambiente, credenciais fictícias, seleção e reset de cenários, comandos e como reproduzir cada falha (R85, R87).

### H18.2 ARCHITECTURE (Must, P)

- Contratos REST e eventos, sessão, carrinho, cache, reconciliação REST × Socket.IO, limitações, decisões de UX e desvios do Figma (R47, R86).

### H18.3 Deploy (Must, P)

- Vercel com mocks e tempo real ativos; acesso direto e refresh em todas as rotas (R84).
- Conferência em pasta limpa: `npm ci`, `npm run dev`, `npm run build`, `npm run test:e2e` (R88).
