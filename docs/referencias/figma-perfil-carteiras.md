# Figma — Perfil do colecionador e Carteiras

Lido a 100% nos frames Desktop / Perfil do Colecionador e Desktop / Carteiras (1440 × 1080, altura fixa, sem rodapé). Medidas aproximadas (±4 px). Textos exatos.

## Estrutura comum

- Header padrão (no frame aparece "Início" ativo).
- Duas colunas abaixo do header, alinhadas ao conteúdo útil (x = 120 a 1320):
  - **menu lateral** com ~310 de largura, fundo Surface Card, começando cerca de 32 abaixo do header;
  - **conteúdo** a partir de ~28 à direita do menu (~860 de largura), em duas colunas de campos de ~417, com espaço de ~28 entre elas.

### Menu lateral — título `Meu perfil`

Itens com ícone de linha à esquerda, texto em Text/Accent; o item ativo tem barra laranja vertical (~6) à esquerda:

1. `Dados do perfil` (ícone de pessoa)
2. `Carteiras` (ícone de pino)
3. `Atividade` (carrinho)
4. `Lista de interesse` (coração)
5. `Ofertas` (gráfico)
6. `Arquivos baixados` (download)
7. `Suporte` (alerta)
8. divisória, depois `Sair` (ícone de saída, texto claro)

## Desktop / Perfil do Colecionador

Título: `Perfil do colecionador`.

| Coluna esquerda | Coluna direita |
| --- | --- |
| `Nome de exibição*` | `Nome de usuário*` |
| `E-mail*` | `Nome ENS*` — select pequeno `.eth` (~78) + input |
| `Apelido da carteira*` | `Avatar` — círculo ~50 com ícone de imagem, botão laranja `Alterar`, link `Remover` |

Seção `Alterar senha` (coluna esquerda, campos com ícone de olho à direita):

- `Senha atual`
- `Nova senha`
- `Confirmar nova senha`

Botão laranja único `Salvar` (~130 × 40) no fim da coluna esquerda.

## Desktop / Carteiras

- Título `Carteira principal` com o link laranja `Adicionar` alinhado à direita.
- Subtítulo: `Estas carteiras ficam disponíveis no pagamento e para receber NFTs comprados.`
- Formulário igual ao do Pagamento:

| Coluna esquerda | Coluna direita |
| --- | --- |
| `Nome de exibição*` | `Apelido da carteira*` |
| `Rede*` (select `Selecione uma rede`) | `Nome do perfil*` |
| `Endereço da carteira*` (placeholder `Endereço 0x da carteira`) | placeholder `ENS ou carteira secundária (opcional)` |
| `Tipo de carteira*` (select `Selecione uma carteira`) | `Código de indicação*` |
| `E-mail*` | `Nome ENS*` (`.eth` + input) |

- Botão laranja `Salvar carteira`.
- Seção `Carteira secundária`, com radio `Igual à carteira principal` e link `Adicionar` à direita. Vazio: `Você ainda não adicionou uma carteira secundária.`
