# Auditoria de fidelidade ao Figma

Data: 28/10/2026. Escopo: todos os frames de `docs/referencias/figma/Desktop` e `docs/referencias/figma/Mobile`, exceto Login e Cadastro (em refação).

## Método

- Referência: PNGs exportados do Figma (desktop com 1440 px de largura, mobile 414 x 896, ambos 1x). As medidas em px vêm desses PNGs e dos prints do app na mesma escala.
- App: servidor de desenvolvimento em modo mock (`http://localhost:5173`), Chromium. Desktop com viewport de 1440 x 900 e print de página inteira. Mobile com viewport de 414 x 896, DPR 1, print só da viewport, porque os frames mobile do Figma mostram apenas a primeira dobra.
- Estados usados:
  - Início e Detalhe: visitante.
  - Carrinho: visitante com Emerald Ape x2, Violet Nomad x6 e Ivory Baron x9 (edição Padrão), as mesmas quantidades do frame.
  - Pagamento, Confirmação, Perfil e Carteiras: logado como Alex, com o mesmo carrinho. A Confirmação usa o cenário `payment-confirmed`.
- Coordenadas sempre em px da página (x a partir da borda esquerda, y a partir do topo). Mobile: x a partir da borda da viewport.
- Imagens lado a lado (Figma à esquerda, App à direita) em `docs/auditoria/figma/lado-a-lado-*.png`. Prints do app em `docs/auditoria/figma/app-*.png`. No mobile, `-viewport` é a primeira dobra, `-rolado` é a tela rolada 700 px e o arquivo sem sufixo é a página inteira.
- Severidade: **alta** = layout quebrado ou elemento faltando/sobrando que muda a tela. **média** = espaçamento, tamanho, alinhamento. **baixa** = detalhe (cor, peso, glifo, copy menor).
- Área: **UI** = componente/estilo. **dados** = conteúdo das fixtures do mock (nome, preço, contagem, arte, token).
- Não são desvios: o cabeçalho logado ("Alex Rocha" no lugar de "Entrar") nas telas autenticadas, e os campos pré-preenchidos no Pagamento, Perfil e Carteiras (premissa 23). O Figma mostra esses estados vazios.

## Comum a todas as telas desktop (cabeçalho, formulários e rodapé)

Valem para todas as telas. Não se repetem nas seções abaixo.

| # | elemento | Figma | App | severidade | área |
|---|---|---|---|---|---|
| C1 | Linha inferior do cabeçalho | Só na largura do container (x 120–1320, y 68), e apenas em Início, Perfil e Carteiras. Detalhe, Carrinho e Pagamento não têm linha | Linha de borda a borda (x 0–1440, y 69) em todas as telas | média | UI |
| C2 | Itens do menu (Início/Mercado/Criadores/Aprenda) | x 496 / 594 / 702 / 829, todos brancos | x 491 / 588 / 696 / 822 (6–7 px à esquerda). "Criadores" e "Aprenda" em cinza, com cara de desabilitado | baixa | UI |
| C3 | Item ativo do menu | "Mercado" ativo (laranja + sublinhado de 2 px) em Detalhe, Carrinho e Pagamento. "Início" ativo em Perfil e Carteiras | Carrinho, Pagamento, Confirmação, Perfil e Carteiras: nenhum item ativo | média | UI |
| C4 | Ícone da lupa no cabeçalho | ~22 px, x 1112–1134 | ~18 px, x 1107–1125 | baixa | UI |
| C5 | Badge do carrinho | Círculo laranja de ~14 px com "6" sobre o ícone (x 1183, y 37) | Visitante sem itens: sem badge. Com 17 unidades: "9+". O Figma mostra "6" com 17 unidades no carrinho, então a regra da contagem precisa ser confirmada (unidades ou linhas) | baixa | dados |
| C6 | Ícone do botão "Entrar" | Ícone de seta saindo de uma caixa (log-out), à esquerda do texto | Ícone de log-in (seta entrando) | baixa | UI |
| C7 | Rótulos de formulário | Peso regular, ~15 px, branco | Negrito, ~13 px | média | UI |
| C8 | Campos de texto e select | Fundo transparente com borda marrom de 1 px, 40 px de altura | Fundo marrom preenchido, sem contraste de borda, 40 px de altura | média | UI |
| C9 | Campo "Nome ENS" | Select ".eth ⌄" de 78 x 40 + campo de texto separado à direita (Perfil/Carteiras: x 903–981 e 991–1320). No Pagamento, só o select ".eth" de 78 px | Um campo único com sufixo ".eth" embutido | média | UI |
| C10 | Rodapé: 4 colunas de destaque (W/C/D + newsletter) | Divisórias em x 417 / 683 / 949 (colunas de ~266 px). "Alertas de lançamentos" em 1 linha. Os 3 círculos alinhados no mesmo y | Divisórias em x 384 / 643 / 903. "Alertas de lançamentos" quebra em 2 linhas e o círculo "D" sobe ~16 px, desalinhado de W e C | média | UI |
| C11 | Faixa marrom do rodapé (KURIO / tagline / contato) | 87 px de altura. "Feito para colecionadores, / criadores e cultura" em 2 linhas a partir de x 555 | 130 px de altura. Tagline em 3 linhas ("Feito para / colecionadores, criadores / e cultura") a partir de x 559 | média | UI |
| C12 | Colunas de links do rodapé | x 152 / 455 / 757 / 1060 (passo de 303 px) | x 152 / 467 / 782 / 1097 (passo de 315 px) | média | UI |
| C13 | Título "Carteiras compatíveis" | 1 linha | Quebra em 2 linhas ("Carteiras / compatíveis") | média | UI |
| C14 | Selo METAMASK · WALLETCONNECT · COINBASE | 228 x 22 px (x 1060–1288), com respiro interno | 191 x 22 px, texto encostado nas bordas | baixa | UI |
| C15 | Ícones das redes sociais | Caixas de 32 px, ícone de ~18 px | Caixas de 30 px, ícone de ~12 px | baixa | UI |

## Início — Desktop

Arquivo: `figma/lado-a-lado-desktop-inicio.png`.

| # | elemento | Figma | App | severidade | área |
|---|---|---|---|---|---|
| 1 | Bloco de texto do hero | "Bem-vindo" y 152, título y 204/275, parágrafo y 323, botão y 416–456 | y 146, título y 194/264, parágrafo y 314, botão y 407–447 (bloco ~9–10 px mais alto) | média | UI |
| 2 | Paginação do carrossel do hero | 3 pontos de 8 px, todos laranja, centros em x 724 / 740 / 756 (passo de 16), y 504 | Pontos em x 664 / 688 / 712 (passo de 24), ~60 px à esquerda. Só o 1º laranja, os outros marrons | média | UI |
| 3 | Contagens das coleções | Arte digital 33, Fotografia 12, Música 65, Arte 3D 39, Colecionáveis 23, Generativa 17, Jogos 19, Assinaturas 13, Utilidade 18 | Todas "(6)" | média | dados |
| 4 | Contagens de rede | Ethereum 119, Polygon 78, Solana 86, em cinza, alinhadas à direita em x ~409 | 23 / 15 / 16, em laranja, alinhadas em x ~397 (mesma coluna das coleções) | baixa | dados |
| 5 | Slider de faixa de preço | 2 alças de ~14 px com borda, em x 162 e 344. Trilho de ~3 px, segue até x 410 | Alças de ~8 px nas pontas (x 160 e 403). Trilho mais fino | média | UI |
| 6 | "Ordenar por" | "Ordenar por:Listados recentemente" a partir de x 1020 | "Ordenar por: Listados recentemente ⌄" a partir de x 994 | baixa | UI |
| 7 | Arte dos cards da grade | Linha 2: Cosmic Bloom = gorila de chapéu, Violet Nomad = gorila de chapéu, Ivory Baron = gorila preto. Linha 3: Golden Beat e Golden Signal = macaco de fones | Linha 2: Cosmic Bloom = macaco de fones, Violet Nomad = macaco de óculos, Ivory Baron = gorila de chapéu. Golden Signal = gorila preto | média | dados |
| 8 | 3ª linha da grade | Golden Beat, card do meio só com imagem (sem nome/preço), Golden Signal | Golden Beat, Golden Signal, Amber Echo (3 cards completos) | baixa | dados |
| 9 | Preço riscado (Neon Vessel) | "2.29 ETH" em cinza, sem risco | "2.29 ETH" com risco (line-through) | baixa | UI |
| 10 | "NFT EM DESTAQUE" | Alinhado à esquerda (x 140) | Centralizado na coluna (x 167) | baixa | UI |
| 11 | Cards promocionais (Lançamentos gênesis / Arte digital) | 586 x 250 px, imagem de 287 px de largura | ~586 x 293 px, imagem de 293 px | média | UI |
| 12 | Título e texto do 2º card promocional | "Arte digital selecionada / e muito mais" em 2 linhas, texto em 3 linhas | Título em 3 linhas ("Arte digital / selecionada e muito / mais"), texto em 4 linhas | média | UI |
| 13 | Arco decorativo dos cards promocionais | Arco fino no canto inferior esquerdo da imagem (x ~120–190) | Arco atravessando a coluna de texto (x ~390–700), por cima de "antes da revelação pública" | média | UI |
| 14 | "Diário da Cunhagem": largura dos cards | 4 cards de 268 px, gap 24, terminando em x 1264 (não ocupa os 1200 px) | 4 cards de 282 px, gap 24, terminando em x 1320 | média | UI |
| 15 | "Diário da Cunhagem": imagem do card | 268 x 195 px | 282 x 205 px | média | UI |
| 16 | "Diário da Cunhagem": título → subtítulo | 38 px entre as linhas de base | 27 px | média | UI |
| 17 | Metadado do post | "12 de setembro \| Leitura de 6 / min" com espaços largos em volta do "\|", quebrando em 2 linhas | "12 de setembro \| Leitura de 6 min" em 1 linha | baixa | UI |
| 18 | Link "Ler mais →" | Seta "→" visível | O glifo da seta sai como um traço baixo ("Ler mais _") | baixa | UI |

## Detalhes do NFT — Desktop

Arquivo: `figma/lado-a-lado-desktop-detalhe.png`.

| # | elemento | Figma | App | severidade | área |
|---|---|---|---|---|---|
| 1 | Miniaturas da galeria | 4 miniaturas de 100 x 100 alinhadas ao topo da imagem principal (x 120, y 131–576, gap 16) | 2 miniaturas centralizadas na vertical (y 246 e 363) | alta | UI |
| 2 | Quantidade de imagens | 4 imagens (mesma arte) | 2 imagens (arte 1 e arte 2) | baixa | dados |
| 3 | Ícone de lupa/zoom na imagem principal | Círculo de ~28 px com lupa no canto superior direito (centro em x 665, y 159) | Ausente | alta | UI |
| 4 | Recuo da imagem principal na moldura | Moldura 444 x 443, imagem de 404 px com recuo de 20 | Imagem de 412 px com recuo de 16 | baixa | UI |
| 5 | Avaliação | "★★★★★ 19 avaliações de colecionadores" à direita do preço (y ~188, terminando em x 1320) | Ausente | alta | UI |
| 6 | Seletor de edição | Chips "1/1", "1/10", "1/50", "ABERTA", 22 px de altura | Chips "Padrão 1/50", "Rara Esgotada", "Lendária 1/1", 28 px de altura | média | UI |
| 7 | Linha de disponibilidade | Não existe | "5 de 50 disponíveis nesta edição" entre a edição e a quantidade | baixa | UI |
| 8 | Posição do seletor de quantidade e do Comprar | y 425 | y 464 (39 px abaixo, por causa dos itens 6 e 7) | média | UI |
| 9 | Botões de ação | COMPRAR 130 x 40 (x 1052–1182) + Favoritar (x 1190–1320) | COMPRAR (x 1004–1134) + botão de carrinho 40 x 40 a mais (x 1142–1182) + Favoritar | média | UI |
| 10 | Ícones +/− do seletor | Traço grosso de ~16 px | Traço fino de ~10 px. O "−" fica marrom quando desabilitado | baixa | UI |
| 11 | Metadados | ID do token, Coleção: Kurio Apes, Atributos: Óculos, Esmeralda, Raro | ID do token, Coleção, Rede, Criador. "Atributos" ausente | média | dados |
| 12 | "Compartilhar este NFT:" com ícones LinkedIn, e-mail e Twitter | Presente (y 576) | Ausente | alta | UI |
| 13 | Aba "Avaliações de colecionadores (19)" | Segunda aba ao lado de "Detalhes do NFT" | Ausente (só a aba "Detalhes do NFT") | alta | UI |
| 14 | Posição das abas | y ~682 | y ~730 (48 px abaixo) | média | UI |
| 15 | Seções da aba Detalhes | Texto em 2 parágrafos + Rede, Contrato, Direitos autorais. 36 px entre os grupos | 1 parágrafo + Rede, Coleção, Criador. 24 px entre os grupos (sem respiro extra) | média | dados |
| 16 | Pontos do carrossel "Mais desta coleção" | 3 pontos (○●○) centralizados abaixo dos cards (y ~1510) | Ausentes | alta | UI |
| 17 | Nome → preço nos cards de "Mais desta coleção" | 18 px. Preço em peso médio, ~15 px | 28 px. Preço em negrito, 16 px | baixa | UI |
| 18 | NFTs de "Mais desta coleção" | Cosmic Bloom, Violet Nomad, Ivory Baron, Golden Beat, Golden Signal | Crimson Nomad #333/#666/#999/#332/#665. Preço riscado com 4 casas ("0.8625 ETH") | baixa | dados |
| 19 | ID do token | #0042 (igual ao nome) | #0001 | baixa | dados |

## Carrinho de NFTs — Desktop

Arquivo: `figma/lado-a-lado-desktop-carrinho.png`.

| # | elemento | Figma | App | severidade | área |
|---|---|---|---|---|---|
| 1 | Espaço entre o breadcrumb e o cabeçalho da tabela | Breadcrumb y 109 → cabeçalho y 137 (28 px) | Breadcrumb y 110 → cabeçalho y 225 (~115 px, 88 px a mais) | alta | UI |
| 2 | Último item do breadcrumb | "Carrinho" em branco | "Carrinho" em laranja | baixa | UI |
| 3 | Colunas do cabeçalho | Preço x 431, Edições x 570, Total x 706. Texto branco, ~15 px | Preço x 490, Edições x 602, Total x 750. Texto laranja apagado, ~13 px | média | UI |
| 4 | Linha do item | 70 px de altura. Miniatura de 70 x 70 encostada na borda esquerda (x 120) | 74 px de altura. Miniatura com recuo (x 152) | média | UI |
| 5 | Texto do item | 2 linhas: nome + "ID do token" | 4 linhas: nome, ID do token, "Edição: Padrão", "N disponíveis" | média | UI |
| 6 | Coluna Preço | "1.19 ETH" em bege/laranja, negrito | Branco, peso regular | baixa | UI |
| 7 | Seletor de quantidade | Pílulas de 18 x 30, número de ~15 px | Pílulas de 32 x 48, número de ~20 px | média | UI |
| 8 | Painel "Resumo da carteira" | Sem fundo próprio. Título de ~18 px em y 137 (alinhado ao cabeçalho da tabela), com divisória logo abaixo | Card com fundo e cantos arredondados (x 988–1320, y 214–667). Título de ~22 px em y 252, sem divisória | média | UI |
| 9 | Campo de código promocional | Borda laranja, fundo transparente, 230 px + "Aplicar" 102 px. Placeholder inteiro | Fundo preenchido, sem borda. Placeholder cortado ("Digite o código prom") | média | UI |
| 10 | "Desconto do lançamento" | 1 linha. Valor "(-) 00.00" | Quebra em 2 linhas. Valor "(-) 0 / ETH" também quebra | média | UI |
| 11 | Valores do resumo | ~16 px, brancos | ~14 px | baixa | UI |
| 12 | "Taxa estimada" | ~11 px, peso regular, abaixo do valor, alinhado à direita | ~9 px, negrito, colado ao valor | baixa | UI |
| 13 | Taxa de rede e total | 0.016 ETH. Total 26.846 ETH | 0.0083 ETH. Total 26.8383 ETH (4 casas) | baixa | dados |
| 14 | Tokens e arte das linhas | Tokens #0042 / #0009 / #0552. Violet Nomad = gorila de chapéu, Ivory Baron = gorila preto | Tokens #0001 / #0005 / #0006. Violet Nomad = macaco de óculos, Ivory Baron = gorila de chapéu | baixa | dados |
| 15 | Seção "Colecionadores também viram" | y 622 | y 771 (149 px abaixo) | média | UI |
| 16 | Pontos do carrossel "Colecionadores também viram" | 3 pontos (○●○) em y 1018 | Ausentes | alta | UI |
| 17 | NFTs sugeridos | Cosmic Bloom, Violet Nomad, Ivory Baron, Golden Beat, Golden Signal | Velvet Signal, Silver Vessel x2, Golden Beat, Jade Echo | baixa | dados |

## Pagamento — Desktop

Arquivo: `figma/lado-a-lado-desktop-pagamento.png`.

| # | elemento | Figma | App | severidade | área |
|---|---|---|---|---|---|
| 1 | Espaço entre o breadcrumb e o título "Perfil do colecionador" | Breadcrumb y 109 → título y 158 (49 px) | Breadcrumb y 110 → título y 230 (~120 px) | média | UI |
| 2 | Títulos "Perfil do colecionador" e "Seus NFTs" | ~16 px, negrito | ~22 px | média | UI |
| 3 | Largura das colunas do formulário | Colunas de 369 px: x 120–489 e x 513–882 | Colunas de 353 px: x 120–473 e x 497–850 | média | UI |
| 4 | Campo "Tipo de carteira" | Select na coluna esquerda (y 449–489), "Selecione uma carteira" | Ausente do formulário. O tipo virou cards na coluna direita | alta | UI |
| 5 | Ordem dos campos | Esquerda: exibição, Rede, Endereço, Tipo de carteira, E-mail. Direita: usuário, perfil, ENS opcional, Código de indicação, Nome ENS | Esquerda: exibição, Rede, Endereço, E-mail, Nome ENS. Direita: usuário, perfil, ENS opcional, Código | média | UI |
| 6 | "Observação do colecionador (opcional)" | Rótulo acima + caixa de 350 x 152 (x 120–470) | Sem rótulo (texto vira placeholder). Caixa de 730 x 127 (largura total do formulário) | média | UI |
| 7 | Radio "Usar outra carteira?" | Círculo vazado laranja de 14 px | Círculo preenchido marrom escuro | baixa | UI |
| 8 | Coluna "Seus NFTs" | Sem painel. x 915–1320 | Card com fundo e cantos arredondados (x 914–1318) | média | UI |
| 9 | Nomes dos itens | Inteiros ("Emerald Ape #042", "ID do token: #0042") | Cortados com reticências ("Emerald Ap…", "ID do token: …") | alta | UI |
| 10 | Miniatura e texto do item | Miniatura de 70 px em x 919, 2 linhas de texto | Miniatura de ~66 px recuada (x ~961), 3 linhas (com "Edição: Padrão") | média | UI |
| 11 | "Tem um código promocional? Aplique aqui" | Centralizado, todo branco | Alinhado à esquerda, "Aplique aqui" como link laranja | baixa | UI |
| 12 | "Taxa estimada" | Centralizado abaixo da taxa (x ~1117) | Alinhado à direita, ~9 px, negrito | baixa | UI |
| 13 | "Carteira e rede" | Título centralizado. 3 opções de 405 x 45 com radio: selo METAMASK·WALLETCONNECT·COINBASE, "MetaMask", "Coinbase Wallet" (selecionada, borda branca) | Título à esquerda. Bloco "Carteira conectada" (card Cofre do Alex) + "Tipo de carteira" com 3 cards de 58 px (MetaMask, WalletConnect, Coinbase) com ícone e check | alta | UI |
| 14 | Ação final | Só o botão "Confirmar compra" de 405 x 45 (y 882–927) | Botão "Conectar carteira" + "Revisar pedido" (desabilitado) + texto "Conecte a carteira para revisar o pedido." O "Confirmar compra" só aparece depois da revisão | alta | UI |

Nota: os itens 13 e 14 vêm do fluxo de conexão e revisão (premissa 23). Mesmo assim divergem do frame. Cabe ao P.O. decidir se o desvio fica aceito.

## Confirmação de Pedido — Desktop

Arquivo: `figma/lado-a-lado-desktop-confirmacao.png`.

| # | elemento | Figma | App | severidade | área |
|---|---|---|---|---|---|
| 1 | Contexto da tela | Modal isolado sobre fundo escuro, sem cabeçalho e sem rodapé. Card em x 431–1009, y 166–987 | Página com cabeçalho e rodapé. Card em x 431–1009, y 102–1094 | alta | UI |
| 2 | Ilustração do envelope | 66 x 80 px, "THANK YOU" grande (ocupa a carta) | ~110 x 90 px, "THANK YOU" minúsculo | média | UI |
| 3 | Título "Seus NFTs agora estão na sua carteira" | ~16 px, bege, 1 linha (y 292) | ~24 px, branco, negrito, 2 linhas (y 295–327) | média | UI |
| 4 | Faixa da transação (ID, Data, Total, Carteira) | Faixa de largura total do card com bordas laranja em cima e embaixo (y 322–388). 4 colunas com divisórias laranja e texto alinhado à esquerda. "ID da transação" e "Carteira" em negrito, valores regulares | Caixa recuada com borda (x 471–969, y 366–463). Texto centralizado, rótulos pequenos e valores em negrito. "ID da transação" e "28 Out, / 2026" quebram em 2 linhas | alta | UI |
| 5 | Hash da transação | Maiúsculas "0xA91F…E82C" | Minúsculas "0x73f4…f36d" | baixa | UI |
| 6 | "Detalhes da transação" e cabeçalho da tabela | Título ~15 px. NFTs/Edições/Subtotal brancos, ~15 px, Edições em x 772 | Título ~18 px. Cabeçalho laranja, ~13 px, Edições em x 829 | baixa | UI |
| 7 | Linhas dos itens | Miniatura de 70 px em x 475, 2 linhas de texto | Miniatura de 66 px em x 495, 3 linhas (com "Edição: Padrão") | baixa | UI |
| 8 | Taxa de rede / Total | Rótulos recuados em x 644 (coluna central) | Rótulos em x 471 (borda esquerda) | média | UI |
| 9 | Botão "Ver no Etherscan" | 186 x 48 px, sem ícone | 234 x 40 px, com ícone de link externo | baixa | UI |
| 10 | Botão fechar (×) | Laranja, em x 986, y 191 | Bege claro, em x 980, y 132 | baixa | UI |
| 11 | Valores | 26.846 ETH, 29 Jul, 2026 | 26.8383 ETH (4 casas), 28 Out, 2026 | baixa | dados |

## Perfil do Colecionador — Desktop

Arquivo: `figma/lado-a-lado-desktop-perfil.png`.

| # | elemento | Figma | App | severidade | área |
|---|---|---|---|---|---|
| 1 | Rodapé | O frame termina em 1080 px sem rodapé | Rodapé completo abaixo do formulário | baixa | UI |
| 2 | Menu lateral "Meu perfil" | x 120–430, y 101–508 (407 px), cantos retos. Título em x 130, y 127 | x 120–430, y 134–614 (480 px), cantos arredondados. Título em x 144, y 170 | média | UI |
| 3 | Passo entre os itens do menu | 45 px | 48 px | média | UI |
| 4 | Itens Atividade, Ofertas, Arquivos baixados, Suporte | Laranja, iguais aos outros | Esmaecidos, com selo "Em breve" a mais | média | UI |
| 5 | Item "Sair" | Texto e ícone laranja, negrito | Branco, peso regular | baixa | UI |
| 6 | Título "Perfil do colecionador" | ~16 px em y 109 | ~24 px em y 150 | média | UI |
| 7 | Passo vertical entre os campos | 103 px (rótulo y 163 → 266 → 369) | 90 px (rótulo y 201 → 291 → 381) | média | UI |
| 8 | Avatar: link "Remover" | Texto "Remover" em x 1095, ao lado de "Alterar" | Ausente (sem avatar cadastrado) | alta | UI |
| 9 | Avatar: botão "Alterar" e texto de ajuda | 98 x 40 px. Sem texto de ajuda | 91 x 36 px. Texto a mais: "PNG, JPEG ou WebP, até 512 KB." | baixa | UI |
| 10 | Título "Alterar senha" | ~16 px em y 474 | ~24 px em y 520 | média | UI |
| 11 | Campos de senha | Passo de 91 px (y 513 / 604 / 695). "Salvar" em y 787 | Texto de ajuda a mais sob "Nova senha" ("Mínimo de 8 caracteres…"). Passo de 90/114 px. "Salvar" em y 848 | baixa | UI |

## Carteiras — Desktop

Arquivo: `figma/lado-a-lado-desktop-carteiras.png`.

| # | elemento | Figma | App | severidade | área |
|---|---|---|---|---|---|
| 1 | Container do formulário | Sem painel. Campos em x 458–875 e x 903–1320 (417 px) | Card com fundo e cantos arredondados (x 458–1320, y 158–790). Recuo de 24 deixa os campos em x 482–875 e x 903–1296 (393 px) | média | UI |
| 2 | Link "Adicionar" da carteira principal | À direita do título, laranja (x 1233–1319, y 109) | Ausente | alta | UI |
| 3 | Título "Carteira principal" e subtítulo | Título ~16 px em y 109, subtítulo logo abaixo (y 133) | Título ~24 px em y 196, subtítulo em y 241 | média | UI |
| 4 | Botão "Salvar carteira" | 131 x 40 px (x 458–589). O texto ocupa a largura toda | 200 x 40 px (x 482–682) | baixa | UI |
| 5 | Bloco "Carteira secundária" | Mesmo fundo da página. Título em y 706, com radio "Igual à carteira principal" e "Adicionar" na mesma linha à direita (x 977–1314) | Card separado (y 814–986). Radio abaixo do título, à esquerda (x 482, y 909). "Adicionar" à direita do título | média | UI |
| 6 | Radio "Igual à carteira principal" | Círculo vazado laranja | Círculo preenchido marrom escuro | baixa | UI |

## Início — Mobile (414 x 896)

Arquivo: `figma/lado-a-lado-mobile-inicio.png`.

| # | elemento | Figma | App | severidade | área |
|---|---|---|---|---|---|
| 1 | Busca + filtro | y 40–85 (45 px). Ícone do filtro com dois "toggles" | y 25–68 (43 px), 15 px mais alto. Ícone de sliders horizontais | baixa | UI |
| 2 | Imagens do hero | Imagem principal de 138 x 138 + miniatura sobreposta (gorila de chapéu, ~58 px) no canto inferior esquerdo da principal | Só a imagem principal | alta | UI |
| 3 | Pontos do carrossel do hero | Dentro do card (y ~282), todos laranja | Fora do card (y ~309). Só o 1º laranja | média | UI |
| 4 | Abas Todos/Novos/Em alta | y 315, abas quase coladas (~4 px entre elas) | y 345 (30 px abaixo), ~16 px entre as abas | média | UI |
| 5 | Botão favoritar no card | Círculo de 28 px no canto superior direito da imagem | Pílula de 58 x 28 px | média | UI |
| 6 | Selo "RARO" no card (Neon Vessel) | Etiqueta laranja de ~68 x 30 no canto superior esquerdo da imagem | Ausente | alta | UI |
| 7 | Nome → preço no card | 18 px | 22 px | baixa | UI |
| 8 | Tab bar inferior | ~96 px de altura, cantos superiores arredondados, recorte côncavo para o botão central | 64 px, borda reta, sem recorte | média | UI |
| 9 | Botão central da tab bar | Círculo laranja de 64 px com ícone de moldura de "scan" | Círculo com anel escuro, ícone de scan + lupa | baixa | UI |
| 10 | Ícones da tab bar | Preenchidos (casa laranja, coração/usuário brancos) | Contorno (outline) | baixa | UI |

## Detalhes do NFT — Mobile (414 x 896)

Arquivo: `figma/lado-a-lado-mobile-detalhe.png`.

| # | elemento | Figma | App | severidade | área |
|---|---|---|---|---|---|
| 1 | Botões voltar e favoritar no topo | Círculos de 34 px (voltar em x 28–62, favoritar em x 354–388). Voltar com chevron "‹" | Pílulas de 58 x 40 (x 47–105 e x 307–365). Voltar com seta "←" | média | UI |
| 2 | Painel de informações sobre a imagem | O painel sobe e cobre a parte de baixo da imagem (início em y 392) | A imagem aparece inteira (y 72–438) e o painel começa em y 487 | média | UI |
| 3 | Pontos da galeria | Não existem | Pílula + ponto abaixo da imagem (y 466) | baixa | UI |
| 4 | Selo de avaliação "★ 4.8(19)" | À direita do título | Ausente | alta | UI |
| 5 | Posição do título | y 438 | y 530 (92 px abaixo) | média | UI |
| 6 | Chips de edição | "1/10", "1/10", "1/50", "ABERTA" | "Padrão 1/50", "Rara Esgotada", "Lendária 1/1" | média | UI |
| 7 | Metadados na primeira dobra | ID do token, Coleção: Kurio Apes, Atributos: Óculos, Esmeralda, Raro (y 621–685) | Fora da primeira dobra (aparecem ao rolar). Mostram ID, Coleção, Rede, Criador. "Atributos" ausente | média | dados |
| 8 | Botão "Comprar NFT" + botão de carrinho | Comprar 196 x 60 (x 24–220) com gradiente. Carrinho de 60 px em x 232–292. Sobra espaço à direita | Comprar 294 x 60 (x 23–317), cor chapada. Carrinho de 60 px em x 329–389 | média | UI |

## Carrinho de NFTs — Mobile (414 x 896)

Arquivo: `figma/lado-a-lado-mobile-carrinho.png`.

| # | elemento | Figma | App | severidade | área |
|---|---|---|---|---|---|
| 1 | Coluna de texto do item | Nome, "Edição: 1/50" e preço legíveis em 3 linhas, ao lado da imagem | Coluna espremida a ~1 caractere de largura: nome reduzido a "E", "V", "I", "ID / do / token:" um por linha. "Qtd." fica por cima de "Edição: Padrão". Item com 224 px de altura | alta | UI |
| 2 | Imagem do item | 100 x 100 encostada na borda esquerda do card (card de 100 px de altura) | ~78 x 78 centralizada numa coluna própria, com recuo | alta | UI |
| 3 | Resumo fixo no rodapé | Painel fixo de y ~555 a 896: código promocional, Subtotal, Desconto, Taxa, Total, "Conectar e finalizar" | Não fica fixo. Na primeira dobra só aparece o título "Resumo da carteira" de um card que vem depois da lista | alta | UI |
| 4 | Cabeçalho | Botão voltar circular de 34 px. Título "Carrinho de NFTs" centralizado (x 124–316) | Pílula de 58 x 40. Título alinhado à esquerda (x 98) | média | UI |
| 5 | Lixeira | Só aparece na linha do Ivory Baron, sobreposta ao "+" (x ~368) | Coluna própria de lixeira à direita de todas as linhas | baixa | UI |
| 6 | Itens do frame | 4 itens (Emerald 1, Violet 1, Ivory 2, Golden Beat 2), subtotal 8.92 ETH | Estado reproduzido com as quantidades do frame desktop (2/6/9) | baixa | dados |

## Pagamento — Mobile (414 x 896)

Arquivo: `figma/lado-a-lado-mobile-pagamento.png`.

| # | elemento | Figma | App | severidade | área |
|---|---|---|---|---|---|
| 1 | Conteúdo da tela | Só a carteira: "Carteira conectada" + link "Trocar carteira", cards Reserva/Principal com radio e menu "⋮", "Carteira e rede" (WalletConnect, MetaMask, Coinbase Wallet), Total e "Confirmar compra" | Abre com o formulário "Perfil do colecionador" inteiro (9 campos + observação). Carteiras e resumo só aparecem depois de rolar | alta | UI |
| 2 | Link "Trocar carteira" | À direita de "Carteira conectada" (x 353–479, y 100) | Ausente | alta | UI |
| 3 | Cards de carteira salva (Reserva/Principal) | 2 cards de 358 x 92 com radio, nome, endereço/ENS, rede e menu "⋮" | Um card "Carteira conectada" sem menu "⋮" | média | UI |
| 4 | Cards de "Carteira e rede" | 358 x 64 com ícone circular de 40 px à esquerda e radio à direita | Cards com check e altura diferente (ver desktop, item 13) | média | UI |
| 5 | Barra fixa inferior | "Total: 8.936 ETH" + botão "Confirmar compra" de 358 x 60 com gradiente | "Total:" + botão "Revisar pedido" (desabilitado, cor chapada) + texto de ajuda | alta | UI |
| 6 | Itens em "Seus NFTs" | Não aparecem no frame | Nomes cortados ("Emeral…", "ID do t…", "Edição:…") | alta | UI |
| 7 | Cabeçalho | Voltar circular de 34 px. Título em x 87 | Pílula de 58 x 40. Título em x 98, ~2 px maior | baixa | UI |

## Totais

| Tela | alta | média | baixa | total |
|---|---|---|---|---|
| Comum desktop (cabeçalho, formulários, rodapé) | 0 | 9 | 6 | 15 |
| Início — Desktop | 0 | 11 | 7 | 18 |
| Detalhes do NFT — Desktop | 6 | 6 | 7 | 19 |
| Carrinho — Desktop | 2 | 8 | 7 | 17 |
| Pagamento — Desktop | 4 | 7 | 3 | 14 |
| Confirmação — Desktop | 2 | 3 | 6 | 11 |
| Perfil — Desktop | 1 | 6 | 4 | 11 |
| Carteiras — Desktop | 1 | 3 | 2 | 6 |
| Início — Mobile | 2 | 4 | 4 | 10 |
| Detalhes do NFT — Mobile | 1 | 6 | 1 | 8 |
| Carrinho — Mobile | 3 | 1 | 2 | 6 |
| Pagamento — Mobile | 4 | 2 | 1 | 7 |
| **Total** | **26** | **66** | **50** | **142** |

Por área: 126 de UI e 16 de dados. Os itens de dados se resolvem nas fixtures do mock (`src/mocks/db/fixtures.ts`): contagens, arte por NFT, tokens, nomes dos sugeridos e casas decimais.

## Prioridade sugerida

1. Carrinho mobile, itens 1 a 3: layout quebrado e resumo não fixo.
2. Pagamento mobile, itens 1, 2, 5 e 6, e Pagamento desktop, itens 4, 9, 13 e 14: estrutura diferente do frame e nomes cortados.
3. Elementos faltando no Detalhe: lupa, avaliação, compartilhar, aba de avaliações, pontos do carrossel, miniaturas no topo. No mobile: selo de avaliação e selo "RARO".
4. Confirmação como modal isolado, com a faixa de transação do Figma.
5. Componentes globais: campo outline (C8), rótulo regular (C7), Nome ENS com select (C9), rodapé (C10 a C13), linha e item ativo do cabeçalho (C1, C3).

## Observação de captura (não é desvio visual)

As seções da Início com `content-visibility: auto` (`defer-render`: cards promocionais e Diário da Cunhagem) saem em branco num print de página inteira do Playwright quando a página não é rolada antes. Para o usuário, a tela aparece normal. Para esta auditoria, a renderização foi forçada só na captura. As baselines de regressão visual de página inteira da Início precisam levar isso em conta.
