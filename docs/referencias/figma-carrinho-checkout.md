# Figma — Carrinho, Pagamento e Confirmação

Lido nos frames a 100% (medidas em px do frame de 1440; conteúdo útil começa em x = 120). Valores aproximados ±4 px; conferir no painel Properties quando possível. Textos são os exatos do layout.

## Desktop / Carrinho de NFTs (1440 × 1754)

- Header padrão com "Mercado" ativo; contador no carrinho.
- Breadcrumb: `Início / Mercado / Carrinho`.
- Duas colunas: lista à esquerda (~782 de largura) e resumo à direita (~332), separadas por ~86.

### Lista

- Cabeçalho de colunas, com linha divisória abaixo: `NFTs` · `Preço` · `Edições` · `Total`.
- Linha do item (altura ~70, fundo Surface Card, espaço ~12 entre linhas):
  - imagem 70 × 70 encostada à esquerda;
  - nome em negrito (ex.: `Emerald Ape #042`) e abaixo `ID do token: #0042` em Text/Secondary;
  - preço unitário (`1.19 ETH`);
  - quantidade: botão circular laranja `−`, número, botão circular laranja `+`;
  - total da linha em laranja (`2.38 ETH`);
  - ícone de lixeira (remover) à direita.

### Resumo — título `Resumo da carteira`

- Rótulo `Código promocional`; input `Digite o código promocional...` colado ao botão `Aplicar`.
- Linhas: `Subtotal` · `Desconto do lançamento` (valor `(-) 00.00`) · `Taxa de rede` com a nota `Taxa estimada` em laranja pequeno, alinhada à direita.
- Divisória, depois `Total` com o valor em laranja e negrito.
- Botão primário de largura total: `Conectar e finalizar`.
- Link centralizado: `Continuar explorando`.

### Abaixo

- Seção `Colecionadores também viram`: carrossel de 5 cards (imagem, nome, preço) com 3 indicadores.
- Faixa padrão do rodapé (W / C / D + "Antecipe-se ao próximo lançamento").

## Desktop / Pagamento (1440 × 1657)

- Breadcrumb: `Início / Mercado / Pagamento`.
- Duas colunas: formulário à esquerda (dois campos por linha, ~370 cada, espaço ~24) e resumo à direita (~405).

### Formulário — título `Perfil do colecionador`

Obrigatórios com `*` em laranja:

| Esquerda | Direita |
| --- | --- |
| `Nome de exibição*` | `Nome de usuário*` |
| `Rede*` (select `Selecione uma rede`) | `Nome do perfil*` |
| `Endereço da carteira*` (placeholder `Endereço 0x da carteira`) | campo sem rótulo, placeholder `ENS ou carteira secundária (opcional)` |
| `Tipo de carteira*` (select `Selecione uma carteira`) | `Código de indicação*` |
| `E-mail*` | `Nome ENS*` (select pequeno `.eth`) |

- Radio `Usar outra carteira?`.
- Textarea `Observação do colecionador (opcional)`.

### Resumo — título `Seus NFTs`

- Cabeçalho `NFTs` · `Subtotal`.
- Linha: imagem ~66, nome, `ID do token`, quantidade `(x 2)` e subtotal em laranja.
- Link `Tem um código promocional? Aplique aqui`.
- `Subtotal`, `Desconto do lançamento`, `Taxa de rede` + `Taxa estimada`; divisória; `Total` em laranja.
- Título `Carteira e rede`: lista de opções em cards com radio (altura ~44, borda; a selecionada com borda laranja):
  - card com o selo `METAMASK · WALLETCONNECT · COINBASE`;
  - `MetaMask`;
  - `Coinbase Wallet`.
- Botão primário de largura total: `Confirmar compra`.

## Desktop / Confirmação de Pedido (1440 × 1657)

Card central (~578 de largura) sobre o fundo da página, com borda inferior laranja grossa (~10):

- Botão fechar `×` no canto superior direito.
- Ilustração de envelope "THANK YOU" em traço laranja.
- Título: `Seus NFTs agora estão na sua carteira`.
- Faixa com 4 colunas separadas por linhas: `ID da transação` (`0xA91F…E82C`) · `Data` (`29 Jul, 2026`) · `Total` (`26.846 ETH`) · `Carteira` (`MetaMask`).
- `Detalhes da transação`; cabeçalho `NFTs` · `Edições` · `Subtotal`; linhas com imagem, nome, `ID do token`, `(x 2)` e subtotal em laranja.
- `Taxa de rede` e `Total` (laranja); divisória.
- Texto: `Transação confirmada na Ethereum. A propriedade foi transferida para sua carteira conectada e registrada na rede.` (a rede vem do pedido).
- Botão `Ver no Etherscan` (link de exploração simulado — R31).

## Mobile / Carrinho de NFTs (414 × 896)

- Topo: botão voltar (círculo com `<`) e título `Carrinho de NFTs`; sem header nem tab bar.
- Cards de item: imagem ~78 à esquerda; nome, `Edição: 1/50` em laranja-claro, preço em laranja; quantidade `− 1 +` à direita (o `−` vira lixeira quando a quantidade é 1).
- Painel inferior fixo arredondado (Surface Raised): input `Digite o código promocional...` com `Aplicar` (pílula), `Subtotal`, `Desconto do lançamento`, `Taxa de rede` + `Taxa estimada`, `Total` em laranja e botão primário em pílula de largura total.

## Mobile / Pagamento (414 × 896)

- Topo: voltar + título `Pagamento com carteira`.
- `Carteira conectada` com o link `Trocar carteira` à direita.
- Cards de carteira com radio e menu `⋮`: `Reserva` · `nova.kurio.eth` · `Rede Polygon`; `Principal` · `0xA91F…E82C` · `Rede principal Ethereum`.
- `Carteira e rede`: cards com ícone circular (`W`, `M`, ícone de carteira) e radio à direita — `WalletConnect`, `MetaMask`, `Coinbase Wallet`.
- `Total:` com o valor em laranja.
- Botão primário em pílula fixo no rodapé.

## Observações para a implementação

- Os textos do Figma prevalecem sobre os da implementação. Onde os page objects usam outro nome (ex.: `Ir para o pagamento` x `Conectar e finalizar`), alinhar com o QA e atualizar o page object — a premissa 17 permite a mudança combinada.
- No desktop, o Pagamento mostra só `Confirmar compra`; a etapa de revisão com revalidação (R24, R26) entra como estado da própria tela (resumo travado + diff do que mudou) antes da confirmação, sem página nova. Registrar como decisão de UX.
- A Confirmação desktop é um card centralizado; no mobile, usa o mesmo card em largura total.
