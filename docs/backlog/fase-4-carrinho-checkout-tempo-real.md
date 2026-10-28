# Fase 4 — Carrinho, checkout, pedido e tempo real

Objetivo: a compra completa funciona do catálogo ao recibo, sem pedido duplicado e sem confirmar nada que a simulação não confirmou. Concentra três itens eliminatórios (R29, R56, R62).

## Épico E10 — Carrinho

### H10.1 Itens e quantidades (Must, M)

- Adicionar, alterar e remover respeitando a disponibilidade por NFT e edição; quantidade inteira (R18, R23).
- Persiste após refresh; itens do visitante são mesclados ao carrinho do usuário no login (R19).

### H10.2 Cupom e resumo (Must, M)

- Aplicar e remover cupom; inválido e expirado com mensagem no campo (R20, R55).
- Subtotal, desconto, taxa de rede e total vêm da cotação da API, como strings decimais (R21, R23).
- Skeleton no resumo durante o carregamento (R67).

### H10.3 Mudança em tempo real (Must, M)

- **Dado** um NFT no carrinho, **quando** chega `nft.updated` com novo preço ou disponibilidade, **então** o item é atualizado, a mudança é anunciada (live region) e o resumo é recotado (R22, R58, R63, R73).

## Épico E11 — Pagamento

### H11.1 Dados e carteira (Must, M)

- Campos do layout validados; seleção de carteira cadastrada e de rede; simulação de conexão, recusa e desconexão da carteira (R05, R24, R25).

### H11.2 Revisão e revalidação (Must, M)

- Antes de confirmar, nova cotação: se preço, disponibilidade, cupom ou taxa mudaram, a tela mostra o que mudou e exige nova confirmação (R26, R63).
- Cotação desatualizada bloqueia a confirmação (R63).

### H11.3 Pedido idempotente (Must, G) — eliminatório

- Uma chave de idempotência por tentativa de compra; clique repetido e reenvio após timeout recuperam o mesmo pedido (R27, R44, R50).
- Pedido nasce pendente; só vira confirmado ou recusado pela simulação (`order.updated` ou consulta REST) (R28, R29, R59).
- Pendente sobrevive a refresh e reconexão; confirmado e recusado são terminais (R28, R64).
- Recusa preserva o carrinho e permite nova tentativa; confirmação remove só os itens e quantidades comprados (R30).

## Épico E12 — Confirmação

### H12.1 Recibo (Must, M)

- Mostra resultado, transação simulada, link de exploração simulado, itens, taxas e total a partir do snapshot do pedido; mudanças posteriores no catálogo não alteram o recibo (R06, R31).
- Acesso direto pela URL do pedido; funciona em mobile sem frame próprio (R11, R45).

## Épico E13 — Tempo real

### H13.1 Robustez dos eventos (Must, M)

- Duplicados e eventos antigos ignorados (id + versão), sem regredir estado (R60).
- Ao reconectar, recursos ativos são reconciliados por REST (R61).
- Testes: T05, T06, T07, T09, T10.

Status: aceita (T05/T06/T07/T09/T10 verdes em desktop e mobile, build de produção).
