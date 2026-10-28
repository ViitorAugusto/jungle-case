# Fase 2 — Design system, layout base, Início e Detalhe

Objetivo: as duas telas de maior peso visual (auditadas no Lighthouse e na regressão visual) idênticas ao Figma em 390, 768 e 1440 px.

Referências: [design system](../referencias/design-system.md), [requisitos](../referencias/requisitos.md).

## Épico E4 — Design system

### H4.1 Tokens (Must, P)

- Cores, tipografia, espaçamentos e raios do Figma em variáveis CSS consumidas pelo Tailwind; nenhum hex ou tamanho solto em componente (R65).
- Roboto Mono servida localmente (sem depender de CDN na auditoria) (R75).

### H4.2 Componentes base (Must, M)

- shadcn/ui adaptado à identidade: botão (primário, secundário, ghost, ícone), input, select, checkbox, radio, tabs, badge, card de NFT, dialog, drawer/sheet, toast, skeleton com shimmer (R65, R67).
- Estados de foco visível, desabilitado, erro e carregamento em todos (R68, R70, R72).
- Skeleton respeita `prefers-reduced-motion` e mantém as dimensões do conteúdo (R67).

### H4.3 Layout base (Must, M)

- Cabeçalho (KURIO, Início, Mercado, Criadores, Aprenda, busca, carrinho com contador, Entrar/usuário) e rodapé conforme o Figma, com menu mobile em drawer (R11, R69).
- Links fora do escopo (Criadores, Aprenda, editorial, suporte) não aparentam sucesso funcional (R12).
- Página 404 no mesmo padrão visual (R45).

## Épico E5 — Início

### H5.1 Destaques e catálogo (Must, G)

*Como visitante, quero explorar os NFTs e filtrar o que me interessa.*

- Hero com destaques; catálogo com abas (Todos os NFTs, Novos lançamentos, Em alta), coleções com contagem, filtros, ordenação e paginação (R02).
- **Dado** filtros aplicados, **quando** recarrego ou volto no histórico, **então** vejo o mesmo estado (R13).
- **Quando** mudo um filtro, **então** volto à página 1 (R14).
- Vazio, erro com "Tentar novamente" e skeleton no carregamento (R15, R40, R67).
- Preço e disponibilidade atualizam em tempo real (R58, consumido do hook do Dev Dados).

## Épico E6 — Detalhe do NFT

### H6.1 Detalhe (Must, G)

- Galeria, informações, seleção de edição, quantidade limitada à disponibilidade, favoritar e adicionar ao carrinho/comprar (R03, R16).
- Acesso direto pela URL, NFT inexistente (estado próprio), edição esgotada (R16, R45).
- Favoritar com atualização otimista e rollback em falha (R46, R17).

## Critério de aceite visual

Comparar cada tela com o frame do Figma em 1440 e com o frame mobile; 768 deve seguir a composição mais próxima sem overflow horizontal (R66, R74). Desvios vão para o `ARCHITECTURE.md`.

Status: aceita (T01/T02 40/40 em desktop e mobile, duas rodadas; arquitetura aprovada). Conferência visual fina contra o Figma entra na regressão visual da F6.
