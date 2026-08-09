# One Piece Ascension — Site v6.3 Team Access

Versão preparada para **GitHub Pages + Supabase**, com banco compartilhado, dois personagens por conta e ativação segura de ADM por **Código da Equipe**.

## Como funciona a conta

Toda conta é um player e mantém até **2 personagens ativos**. A permissão administrativa é adicional:

- `player` — 2 personagens + edição das próprias fichas;
- `admin` — tudo de Player + Painel ADM;
- `owner` — tudo de ADM + gerenciamento do Código da Equipe e da equipe.

Um ADM não perde nem separa os próprios personagens.

## Código da Equipe

O código **não existe no HTML/JavaScript do GitHub**. O navegador envia o valor digitado ao Supabase e o banco compara com um hash privado.

Proteções incluídas:

- e-mail confirmado antes da ativação;
- 5 tentativas erradas em 15 minutos por conta;
- Owner pode pausar novas ativações;
- Owner pode trocar o código sem remover ADMs atuais;
- Owner pode remover a permissão ADM sem apagar os personagens;
- somente o primeiro `owner` precisa ser definido manualmente uma única vez.

O ADM pode ativar o acesso de três formas: durante o cadastro, no login ou em **Meus Personagens → Ativar acesso ADM**. Depois de ativado, não precisa digitar o código novamente.

## Estrutura

- `index.html` — hub + login/cadastro com Código da Equipe opcional.
- `Pages/player.html` — 2 personagens + autoatualização + ativação ADM.
- `Pages/admin.html` — auditoria; Owner também gerencia acesso da equipe.
- `Js/app.js` — Auth, RPCs, realtime, auditoria e papéis.
- `Js/supabase-config.js` — Project URL + chave pública.
- `Supabase/schema.sql` — banco, RLS, funções, Código da Equipe e realtime.
- `Docs/CONFIGURAR_SUPABASE.md` — instalação passo a passo.

## Buffs

O teto permanece **+1000% GLOBAL de buffs comuns**, somando todos os atributos. Haki e Akuma no Mi ficam fora desse teto.

## Fluxo de ficha

Player salva a própria alteração → PostgreSQL valida → histórico registra antes/depois → alteração entra como `Pendente` → ADM confere com o aviso do WhatsApp → marca como `Conferido` ou `Sinalizado`.

## Antes de publicar

1. Execute `Supabase/schema.sql` no SQL Editor.
2. Preencha `Js/supabase-config.js` com Project URL + publishable/anon key.
3. Cadastre sua conta e defina **somente ela** como `owner` uma única vez.
4. Pelo Painel ADM, configure o Código da Equipe.
5. Suba tudo no GitHub Pages.

**Nunca coloque `service_role`, senha do banco ou o Código da Equipe no repositório.**
