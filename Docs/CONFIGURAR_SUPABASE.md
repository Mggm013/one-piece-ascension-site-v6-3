# One Piece Ascension v6.3 — Supabase + Código da Equipe

O site usa **GitHub Pages para o frontend** e **Supabase para autenticação, fichas, permissões e auditoria compartilhada**.

## 1. Criar o projeto Supabase

Crie um projeto, abra o **SQL Editor**, copie todo o conteúdo de `Supabase/schema.sql` e execute. O script é idempotente para a estrutura principal e também inclui a atualização de `player/admin` para `player/admin/owner`.

Se você já usava a v6.2 com dados reais, faça um backup antes e execute o schema v6.3; ele não contém comandos de exclusão das fichas ou do histórico.

## 2. Configurar a chave pública

Em `Js/supabase-config.js`, preencha apenas:

```js
window.OPA_SUPABASE_CONFIG = {
  url: 'SUA_PROJECT_URL',
  anonKey: 'SUA_PUBLISHABLE_OU_ANON_KEY'
};
```

Nunca use `service_role` no GitHub.

## 3. Authentication

Mantenha cadastro por e-mail e senha habilitado. **Recomenda-se confirmação de e-mail**, porque o Código da Equipe só transforma uma conta em ADM depois que o e-mail estiver confirmado. Configure a URL do GitHub Pages como Site URL/redirect permitido quando necessário.

## 4. Criar o primeiro Owner — única etapa manual

Cadastre a sua conta normalmente. Depois, no SQL Editor, execute **uma única vez**:

```sql
update public.profiles
set role = 'owner'
where username = 'SEU_USUARIO';
```

Saia e entre novamente. Sua conta continua com os **2 personagens normais**, mas passa a exibir `Auditoria ADM` e a seção **Acesso da Equipe**.

## 5. Definir o Código da Equipe pelo próprio site

No Painel ADM do Owner:

1. abra **Acesso da Equipe**;
2. digite um novo código com pelo menos 10 caracteres;
3. clique em **Salvar novo código**.

O texto do código não é armazenado. O banco salva somente um **hash bcrypt**. O frontend nunca possui uma função para ler o código atual.

## 6. Como os outros ADMs entram

Você não precisa promover um por um. Cada ADM cria a própria conta e pode informar o Código da Equipe em qualquer um destes lugares:

- cadastro;
- login, caso ainda não tenha ativado;
- `Meus Personagens → Ativar acesso ADM`.

Depois de uma ativação correta, `role` vira `admin` permanentemente. Nos próximos logins o campo pode ficar vazio. A conta continua tendo os próprios 2 personagens.

## 7. Segurança do Código da Equipe

A função `claim_admin_role` roda no PostgreSQL como RPC protegida. Ela exige:

- usuário autenticado;
- e-mail confirmado;
- novas ativações liberadas pelo Owner;
- código igual ao hash privado;
- menos de 5 falhas nos últimos 15 minutos naquela conta.

O código não é enviado em `raw_user_meta_data`, não é salvo em `localStorage` e não aparece no repositório. Quando o cadastro exige confirmação de e-mail, o site pode manter o valor apenas temporariamente em `sessionStorage`; se a confirmação abrir em outro navegador/aba, basta digitá-lo novamente no login ou na tela de ativação.

## 8. Controles do Owner

O Owner pode:

- trocar o Código da Equipe;
- pausar/liberar novas ativações de ADM;
- visualizar ADMs ativos;
- remover a permissão de um ADM, fazendo a conta voltar para `player`;
- manter intactos os personagens e o histórico da pessoa.

Trocar o código **não derruba ADMs existentes**.

## 9. Permissões

### Player
Tem 2 personagens e altera somente as próprias fichas por RPC auditável.

### ADM
Tem tudo de Player e também lê todos os players/personagens, audita alterações e registra correções administrativas.

### Owner
Tem tudo de ADM e gerencia o acesso da equipe. Não existe Código de Owner compartilhado.

## 10. GitHub Pages

Suba o conteúdo do projeto para o GitHub e ative o Pages. A arquitetura será:

```text
GitHub Pages
  ↓
HTML/CSS/JavaScript
  ↓
Supabase Auth
  ↓
RPCs + RLS
  ↓
PostgreSQL compartilhado
```

## Integridade das fichas

O navegador não possui escrita direta em `characters` ou `change_log`. As alterações passam pelas RPCs do banco, que verificam propriedade da ficha, dois slots e teto global de +1000% de buffs comuns. Haki e Akuma permanecem fora do teto.
