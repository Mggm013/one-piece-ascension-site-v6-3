# One Piece Ascension — Changelog v6.0

## Regra central
- Buffs comuns de atributos compartilham teto global de 1000%.
- Haki e Akuma ficam fora.
- Buffs comuns são aditivos; Haki/Akuma aplicáveis também são somados, não multiplicados em cadeia.
- Excedente acima de 1000% não produz efeito.

## Ficha/site
- 2 personagens ativos por player.
- Atributos reais: FOR/RES/AGI/PRE/INT/ESP.
- Histórico de atualizações.
- Origem obrigatória dos pontos.
- Resumo para WhatsApp.
- Backup JSON.

## Evolução
- Máx. 4 treinos recompensados por semana.
- Treinos extras continuam possíveis por RP sem pontos.
- Treino de ambiente modifica treino existente.

## Missões
- Ordem de dificuldade corrigida.
- Pontos mecânicos definidos por tier.
- Máx. 3 auto-narradas com recompensa cheia/semana.
- Akuma em baú vira oportunidade sujeita a estoque/ADM.

## Combate
- Matriz universal ofensivo vs defensivo.
- Turno 0 permite emboscada previamente conquistada.
- Estados padronizados e sem stack consigo mesmos.

## HP/Dano
- Espírito redefinido de forma coerente.
- HP não aplica modificadores genéricos de raça/profissão duas vezes.
- Dano físico não depende de Espírito.
- Removido dano mínimo universal de 1%.

## Profissões/EDL
- Subprofissão: cooldown 7 dias + cena.
- Perícia não é substituída por INT alta após troca.
- Combatente Monstro: teto +300% FOR.
- EDL entra no teto comum; parcela de Haki fica fora.

## Haki/Akuma
- Cargas por estágio para acabar com custos ambíguos.
- Future Sight tem contra-jogo.
- Despertar usa cargas e mantém arco obrigatório.

## Navios/Armas
- Preços de navios adicionados e alinhados aos tetos econômicos.
- Grande Canhão exige Fragata+.
- Reparo automático escalável.
- Teto global tem precedência sobre teto de armas.
- Bônus total de melhoria substitui o bônus anterior da arma.

## Economia/Submundo
- Investimentos legais aumentados.
- Materiais de construções reduzidos para custo coerente.
- Transação de submundo anti-farm.
- “Kairosheki ilimitado” = catálogo liberado, não estoque infinito.

## NPCs/Facções
- Custo de frota explicitamente semanal.
- Requisitos equivalentes por facção.
- Shichibukai caçador não exige recompensa ativa.
- Marinha expandida até Almirante de Frota 1M + Evento ADM.
- Diretor de Impel Down separado.

## Navegação
- Viagem longa = 3 rolagens; cada uma usa chance regional.
- Viagens curtas dos Blues não usam o procedimento salvo evento narrativo.

# Complemento v6.1 — Player Audit

## Fluxo de ficha
- O player passa a editar os próprios 2 personagens.
- ADM deixa de ser o responsável normal por distribuir/aplicar pontos no site.
- Toda alteração do player recebe origem, referência, data e autor.
- Histórico registra valor anterior e novo valor.
- Alteração do player entra como `Pendente` na auditoria.
- ADM pode marcar `Conferido`, `Sinalizado` ou devolver para `Pendente`.
- Sinalizações recebem nota administrativa.
- O player recebe resumo pronto para informar no WhatsApp.

## Central ADM
- Fila geral de alterações de todos os personagens.
- Contadores de pendentes, conferidos e sinalizados.
- Filtro por status e pesquisa textual.
- Consulta da ficha atual sem transformar o painel ADM no editor principal.
- Correção Administrativa excepcional e sempre registrada como nova entrada.

# Complemento v6.2 — Shared Database

## Backend compartilhado
- `localStorage` deixa de armazenar fichas e histórico.
- Supabase Auth passa a controlar login por e-mail/senha.
- PostgreSQL armazena contas, personagens e auditoria.
- `localStorage` permanece somente para preferências locais (personagem selecionado, último resumo etc.).
- Supabase Realtime atualiza a fila ADM quando players salvam em outros dispositivos.

## Segurança
- Players não recebem permissão SQL direta de escrita nas tabelas centrais.
- Alterações passam por RPCs `SECURITY DEFINER` que verificam `auth.uid()` e propriedade do personagem.
- O banco valida máximo de 2 personagens ativos.
- O banco valida o teto de +1000% de buffs comuns.
- Haki e Akuma ficam armazenados fora desse teto.
- Não existe mais código secreto de ADM no JavaScript.
- `role='admin'` é definido no banco e não pode ser alterado pelo próprio player.
- Histórico mantém `before_state` e `after_state` e não pode ser editado pelo player.

## GitHub Pages
- Adicionado `Js/supabase-config.js` para Project URL + publishable/anon key.
- Adicionado `Supabase/schema.sql` com tabelas, RLS, RPCs, índices e Realtime.
- Adicionado `Docs/CONFIGURAR_SUPABASE.md` com instalação completa.


# Complemento v6.3 — Team Access Seguro

- Papéis `player`, `admin` e `owner`; todos mantêm 2 personagens.
- Código da Equipe opcional no cadastro/login e ativação posterior no painel do player.
- Código validado no backend contra hash bcrypt; segredo não fica no GitHub.
- 5 tentativas incorretas em 15 minutos por conta.
- E-mail confirmado obrigatório para ativação ADM.
- Owner pode trocar o código, pausar novas ativações e remover permissão ADM.
- Troca de código não revoga ADMs existentes.
- Log administrativo separado para ações de acesso.
- Realtime também acompanha mudanças de perfil/permissão.
