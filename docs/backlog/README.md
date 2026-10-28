# Backlog

Requisitos referenciados por código (R/T) em [requisitos](../referencias/requisitos.md). Premissas em [premissas](../decisoes/premissas.md).

## Fases

| Fase | Objetivo | Dono principal | Depende de |
| --- | --- | --- | --- |
| [F0](fase-0-fundacao.md) | Projeto rodando com a stack obrigatória, camadas e scripts | Tech Lead | — |
| [F1](fase-1-dominio-api-mocks.md) | Domínio, contratos REST/eventos, cliente HTTP/socket, MSW com estado e cenários | Dev Dados | F0 |
| [F2](fase-2-design-system-catalogo.md) | Design system do Figma, layout base, Início e Detalhe | Dev UI | F0, Figma |
| [F3](fase-3-conta-sessao.md) | Cadastro, login, sessão, rotas privadas, favoritos | Dev Dados + Dev UI | F1, F2 |
| [F4](fase-4-carrinho-checkout-tempo-real.md) | Carrinho, cotação, pagamento, pedido idempotente, confirmação, tempo real | Dev Dados + Dev UI | F3 |
| [F5](fase-5-perfil-carteiras.md) | Perfil, avatar, senha, carteiras | Dev UI + Dev Dados | F3 |
| [F6](fase-6-qualidade-entrega.md) | Playwright, regressão visual, Lighthouse, README, ARCHITECTURE, deploy | QA + Tech Lead | F2–F5 |

QA escreve os testes de cada fase assim que ela chega ao aceite, e não só na F6.

## Prioridade (prazo de 2 dias)

Primeiro o que elimina, depois o que pesa mais na pontuação:

1. Eliminatórios: stack efetiva (R01), compra só com resposta da simulação (R29), isolamento entre usuários (R35, R62), eventos pelo socket.io-client via MSW (R56) e E2E executável (R76).
2. Fluxos e visual (40 pts): catálogo, detalhe, carrinho, checkout e confirmação fiéis ao Figma em 390/768/1440.
3. Integração e estado (15) e tempo real (10).
4. Mocks (10) e testes (10).
5. A11y, performance e docs (15) entram ao longo das fases, não no final.

Se o tempo apertar, corta-se profundidade (variedade de cenários, número de baselines), nunca um item eliminatório.

## Definição de pronto

- Atende todos os critérios da história e os requisitos citados.
- Fiel ao Figma em 390, 768 e 1440 px; estados não desenhados seguem o mesmo padrão visual.
- Camadas respeitadas: tela → hook → caso de uso → adaptador. Tela não chama Axios nem socket direto.
- Carregamento, vazio, erro e sucesso tratados; feedback acessível.
- Typecheck, lint e build passando; teste Playwright da história verde.
- Revisado pelo Tech Lead e aceito pelo P.O.
