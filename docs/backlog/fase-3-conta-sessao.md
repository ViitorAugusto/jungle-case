# Fase 3 — Conta, sessão e favoritos

Objetivo: o colecionador entra, a sessão sobrevive a refresh e expira com segurança, e nada de um usuário aparece para outro.

## Épico E7 — Cadastro e login

### H7.1 Cadastro (Must, M)

*Como visitante, quero criar minha conta para comprar e salvar favoritos.*

- Campos e validações do Figma, com erro associado a cada campo e anunciado (R08, R70).
- **Dado** um e-mail já cadastrado, **quando** envio, **então** a API responde 409 e o erro aparece no campo de e-mail (R08, R55).
- Erro de validação da API (422) aparece no campo correspondente (R36).
- Sucesso autentica e volta ao fluxo anterior.

### H7.2 Login (Must, M)

- Credenciais inválidas mostram erro sem revelar qual campo errou.
- **Dado** que fui mandado ao login a partir do checkout, **quando** entro, **então** volto ao checkout com o carrinho preservado (R07, R19).
- Senha nunca trafega nem fica salva em claro no cliente (R37).

## Épico E8 — Sessão

### H8.1 Sessão persistente (Must, M)

- **Dado** que estou logado, **quando** recarrego qualquer tela, **então** continuo logado (R34).
- Rotas privadas (checkout, perfil, carteiras, favoritos, pedidos) redirecionam para o login com retorno (R33, R38).

### H8.2 Expiração (Must, M)

- **Dado** cenário "sessão expirada", **quando** navego, **então** sou levado ao login com aviso e, após entrar, volto onde estava (R34).
- **Dado** expiração durante o checkout, **então** os dados preenchidos e o carrinho são preservados para retomada (R34).

### H8.3 Logout e troca de usuário (Must, M) — eliminatório

- Logout limpa todo cache privado do Query (favoritos, carrinho do usuário, perfil, carteiras, pedidos) e encerra o socket da sessão (R35, R62).
- **Dado** que saio como usuário A e entro como B, **então** nenhum dado de A aparece, nem por cache nem por evento atrasado (R35, R43, R62).

## Épico E9 — Favoritos

### H9.1 Favoritar (Must, P)

- Exige login; persiste após refresh (R17).
- Atualização otimista com rollback e aviso acessível em falha (R46, R73).
- Teste: T04.

Status: aceita (T03/T04 44/44 e regressão 180/180, duas rodadas).
