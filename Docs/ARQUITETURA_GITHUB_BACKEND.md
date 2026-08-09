# Arquitetura v6.3 — GitHub Pages + Supabase

## Princípio

**Uma conta = uma pessoa = até 2 personagens.** O papel administrativo é uma permissão adicional e nunca substitui a condição de player.

## Papéis

- `player`: próprios personagens e histórico;
- `admin`: tudo de player + auditoria geral;
- `owner`: tudo de admin + gestão da equipe.

## Ativação ADM

O Owner configura um Código da Equipe pelo site. O banco armazena apenas o hash. Um player autenticado e com e-mail confirmado pode apresentar o código à RPC `claim_admin_role`. Em caso de sucesso, a própria conta vira `admin`.

O frontend não contém o segredo. DevTools ou leitura do repositório não revela o código.

## Proteções

- 5 falhas/15 minutos por conta;
- ativação pode ser pausada;
- código pode ser rotacionado;
- ADMs existentes sobrevivem à rotação;
- Owner não é concedido por código;
- remoção de ADM não apaga personagens;
- ações de gestão são gravadas em `admin_activity_log`.

## Dados

- `profiles`: username e `player/admin/owner`;
- `characters`: ficha atual, 2 slots ativos;
- `change_log`: histórico append-only antes/depois;
- `team_settings`: hash do Código da Equipe + chave de ativação;
- `admin_claim_attempts`: limite de tentativas;
- `admin_activity_log`: promoções, remoções, rotação e pausa do cadastro ADM.

## Realtime

O frontend acompanha mudanças em `profiles`, `characters` e `change_log`. Mesmo que uma interface fique desatualizada por alguns segundos, as RPCs consultam a permissão no banco a cada ação administrativa.

## Segredos

No GitHub ficam somente Project URL e publishable/anon key. Não publicar `service_role`, senha de banco ou Código da Equipe.
