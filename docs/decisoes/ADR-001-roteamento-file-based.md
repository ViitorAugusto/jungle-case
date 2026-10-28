# ADR-001: TanStack Router com rotas file-based

- **Status:** aceita
- **Data:** 2026-10-27
- **Requisitos relacionados:** R13, R33, R38, R45

## Contexto

O enunciado exige TanStack Router para rotas, search params tipados e proteção de rotas privadas. O roteador aceita dois modos: rotas declaradas em código (code-based) ou geradas a partir de arquivos (file-based, com o plugin do Vite).

## Decisão

Usar **file-based routing** com `@tanstack/router-plugin/vite`:

- rotas em `src/presentation/routes/` (camada de apresentação);
- árvore gerada em `src/presentation/route-tree.gen.ts`, versionada para que `typecheck` funcione em checkout limpo;
- `autoCodeSplitting` ativo: cada rota vira um chunk carregado sob demanda;
- rotas privadas agrupadas em um layout sem caminho (`_autenticado/`) com `beforeLoad` que redireciona ao login guardando o destino;
- `tsr generate` roda antes de `typecheck` e `build` (config em `tsr.config.json`, espelhando a do plugin).

## Consequências

- **Positivas:** tipagem de `params`/`search` inferida sem registro manual; code splitting por rota sem configuração (ajuda nas metas de Lighthouse); a estrutura de pastas espelha as URLs; proteção de rotas concentrada em um único layout.
- **Negativas:** arquivo gerado no repositório (ignorado por ESLint e Prettier); convenções de nome (`__root.tsx`, `$id.tsx`, `_layout/`) precisam ser seguidas. As telas ficam em `src/presentation/screens/` e os arquivos de rota só ligam rota → tela, `validateSearch` e `loader`.
