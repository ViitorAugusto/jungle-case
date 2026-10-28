# Fase 0 — Fundação

Objetivo: projeto executável com a stack obrigatória em uso efetivo (R01) e a estrutura de camadas pronta.

## H0.1 Projeto e stack (Must, M)

- Vite + React + TypeScript estrito; Tailwind CSS e shadcn/ui; TanStack Router e Query; Axios com instância única; socket.io-client; MSW ativado por `VITE_ENABLE_MOCKS`, inclusive no build de demonstração (R01, R57).

## H0.2 Camadas e padrões (Must, P)

- Pastas por camada (domínio, aplicação, adaptadores, infraestrutura, apresentação, mocks) com fronteiras verificadas pelo lint (R39).
- ESLint, Prettier, typecheck, hooks de commit com Conventional Commits.

## H0.3 Comandos e publicação (Must, P)

- Scripts de dev com mocks, build, preview, typecheck, lint, Playwright e Lighthouse (R87).
- Rewrite de SPA para acesso direto e refresh no deploy (R84).
- Esqueleto do `ARCHITECTURE.md` com as seções do R86.

Status: concluída e aceita.
