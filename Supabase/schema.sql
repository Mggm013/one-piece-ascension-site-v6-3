-- ONE PIECE ASCENSION v6.3 — BANCO COMPARTILHADO + CÓDIGO SEGURO DE EQUIPE
-- Execute TODO este arquivo no SQL Editor de um projeto Supabase novo.
-- Depois registre sua conta normalmente no site e promova APENAS a primeira conta a OWNER
-- com o comando indicado no final. A partir daí, os demais ADMs entram pelo Código da Equipe.

create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;

-- =========================================================
-- PERFIS
-- =========================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique check (char_length(username) between 3 and 40),
  role text not null default 'player' check (role in ('player','admin','owner')),
  avatar_url text,
  created_at timestamptz not null default now()
);

-- Garante compatibilidade ao executar v6.3 sobre um banco v6.2 existente.
do $$
begin
  alter table public.profiles drop constraint if exists profiles_role_check;
  alter table public.profiles add constraint profiles_role_check check (role in ('player','admin','owner'));
exception when duplicate_object then null;
end $$;

-- =========================================================
-- ACESSO DA EQUIPE (segredo fica somente no banco)
-- =========================================================
create table if not exists public.team_settings (
  id smallint primary key default 1 check (id = 1),
  admin_code_hash text,
  admin_signup_enabled boolean not null default true,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id) on delete set null
);
insert into public.team_settings(id) values (1) on conflict (id) do nothing;

create table if not exists public.admin_claim_attempts (
  id bigserial primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  attempted_at timestamptz not null default now(),
  success boolean not null default false
);
create index if not exists admin_claim_attempts_user_time_idx
  on public.admin_claim_attempts(user_id, attempted_at desc);

create table if not exists public.admin_activity_log (
  id bigserial primary key,
  actor_id uuid references public.profiles(id) on delete set null,
  target_id uuid references public.profiles(id) on delete set null,
  action text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists admin_activity_created_idx on public.admin_activity_log(created_at desc);

-- =========================================================
-- PERSONAGENS
-- =========================================================
create table if not exists public.characters (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  slot smallint check (slot in (1,2) or slot is null),
  status text not null default 'Ativo' check (status in ('Ativo','Falecido','Arquivado')),
  nome text not null check (char_length(nome) between 1 and 100),
  faccao text not null default 'Pirata',
  cargo text not null default '',
  berries bigint not null default 5000000 check (berries >= 0),
  raca text not null default '',
  linhagem text not null default '',
  profissao text not null default '',
  subprofissao text not null default '',
  edl text not null default '',
  akuma_nome text not null default '',
  localizacao text not null default '',
  navio text not null default 'Bote básico',

  attr_for bigint not null default 0 check (attr_for >= 0),
  attr_res bigint not null default 0 check (attr_res >= 0),
  attr_agi bigint not null default 0 check (attr_agi >= 0),
  attr_pre bigint not null default 0 check (attr_pre >= 0),
  attr_int bigint not null default 0 check (attr_int >= 0),
  attr_esp bigint not null default 0 check (attr_esp >= 0),

  buff_for integer not null default 0 check (buff_for >= 0),
  buff_res integer not null default 0 check (buff_res >= 0),
  buff_agi integer not null default 0 check (buff_agi >= 0),
  buff_pre integer not null default 0 check (buff_pre >= 0),
  buff_int integer not null default 0 check (buff_int >= 0),
  buff_esp integer not null default 0 check (buff_esp >= 0),

  -- Haki e Akuma NÃO entram no teto global de buffs comuns.
  haki_bonus numeric(10,2) not null default 0 check (haki_bonus >= 0),
  akuma_bonus numeric(10,2) not null default 0 check (akuma_bonus >= 0),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint common_buff_cap check (
    buff_for + buff_res + buff_agi + buff_pre + buff_int + buff_esp <= 1000
  )
);

create unique index if not exists characters_owner_active_slot_uq
  on public.characters(owner_id, slot)
  where status = 'Ativo' and slot is not null;
create index if not exists characters_owner_idx on public.characters(owner_id);
create index if not exists characters_status_idx on public.characters(status);

-- =========================================================
-- HISTÓRICO / AUDITORIA
-- =========================================================
create table if not exists public.change_log (
  id uuid primary key default gen_random_uuid(),
  character_id uuid not null references public.characters(id) on delete cascade,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  actor_role text not null check (actor_role in ('player','admin','system')),
  change_type text not null,
  origin text not null,
  reference text not null default '',
  changes jsonb not null default '{}'::jsonb,
  before_state jsonb not null default '{}'::jsonb,
  after_state jsonb not null default '{}'::jsonb,
  audit_status text not null default 'Pendente' check (audit_status in ('Pendente','Conferido','Sinalizado','Dispensado')),
  audit_by uuid references public.profiles(id) on delete set null,
  audit_at timestamptz,
  audit_note text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists change_log_owner_idx on public.change_log(owner_id);
create index if not exists change_log_character_idx on public.change_log(character_id);
create index if not exists change_log_status_created_idx on public.change_log(audit_status, created_at desc);

-- =========================================================
-- HELPERS
-- =========================================================
create or replace function public.is_admin(p_user uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = p_user and p.role in ('admin','owner')
  );
$$;

create or replace function public.is_owner(p_user uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = p_user and p.role = 'owner'
  );
$$;

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists characters_touch_updated_at on public.characters;
create trigger characters_touch_updated_at
before update on public.characters
for each row execute function public.touch_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_username text;
begin
  v_username := trim(coalesce(new.raw_user_meta_data ->> 'username', split_part(coalesce(new.email,''), '@', 1)));
  if char_length(v_username) < 3 then
    raise exception 'Nome de usuário inválido.';
  end if;
  insert into public.profiles(id, username, role)
  values (new.id, v_username, 'player');
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- =========================================================
-- RLS — o navegador só lê o que pode ler.
-- Escritas de ficha/histórico são feitas APENAS pelas RPCs abaixo.
-- =========================================================
alter table public.profiles enable row level security;
alter table public.characters enable row level security;
alter table public.change_log enable row level security;
alter table public.admin_activity_log enable row level security;
alter table public.team_settings enable row level security;
alter table public.admin_claim_attempts enable row level security;

revoke all on public.profiles from anon, authenticated;
revoke all on public.characters from anon, authenticated;
revoke all on public.change_log from anon, authenticated;
revoke all on public.team_settings from anon, authenticated;
revoke all on public.admin_claim_attempts from anon, authenticated;
revoke all on public.admin_activity_log from anon, authenticated;

grant select on public.profiles to authenticated;
grant select on public.characters to authenticated;
grant select on public.change_log to authenticated;
grant select on public.admin_activity_log to authenticated;

drop policy if exists profiles_read_self_or_admin on public.profiles;
create policy profiles_read_self_or_admin on public.profiles
for select to authenticated
using ((select auth.uid()) = id or public.is_admin((select auth.uid())));

drop policy if exists characters_read_self_or_admin on public.characters;
create policy characters_read_self_or_admin on public.characters
for select to authenticated
using ((select auth.uid()) = owner_id or public.is_admin((select auth.uid())));

drop policy if exists logs_read_self_or_admin on public.change_log;
create policy logs_read_self_or_admin on public.change_log
for select to authenticated
using ((select auth.uid()) = owner_id or public.is_admin((select auth.uid())));

drop policy if exists admin_activity_read_staff on public.admin_activity_log;
create policy admin_activity_read_staff on public.admin_activity_log
for select to authenticated
using (public.is_admin((select auth.uid())));

-- =========================================================
-- RPC: CÓDIGO DA EQUIPE / OWNER
-- =========================================================
create or replace function public.claim_admin_role(p_code text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_role text;
  v_email_confirmed timestamptz;
  v_hash text;
  v_enabled boolean;
  v_failed integer;
  v_ok boolean := false;
begin
  if v_uid is null then return jsonb_build_object('ok',false,'message','Faça login antes de ativar o acesso ADM.'); end if;

  select p.role into v_role from public.profiles p where p.id=v_uid;
  if v_role in ('admin','owner') then
    return jsonb_build_object('ok',true,'already',true,'role',v_role,'message','A conta já possui acesso administrativo.');
  end if;

  select u.email_confirmed_at into v_email_confirmed from auth.users u where u.id=v_uid;
  if v_email_confirmed is null then
    return jsonb_build_object('ok',false,'message','Confirme o e-mail antes de ativar o acesso ADM.');
  end if;

  select count(*)::int into v_failed
  from public.admin_claim_attempts a
  where a.user_id=v_uid and a.success=false and a.attempted_at > now() - interval '15 minutes';
  if v_failed >= 5 then
    return jsonb_build_object('ok',false,'locked',true,'message','Muitas tentativas incorretas. Aguarde 15 minutos antes de tentar novamente.');
  end if;

  select t.admin_code_hash,t.admin_signup_enabled into v_hash,v_enabled
  from public.team_settings t where t.id=1;
  if not coalesce(v_enabled,false) then
    return jsonb_build_object('ok',false,'message','Novas ativações de ADM estão temporariamente pausadas pelo Owner.');
  end if;
  if v_hash is null or v_hash='' then
    return jsonb_build_object('ok',false,'message','O Owner ainda não configurou o Código da Equipe.');
  end if;
  if char_length(trim(coalesce(p_code,''))) < 1 then
    return jsonb_build_object('ok',false,'message','Informe o Código da Equipe.');
  end if;

  v_ok := extensions.crypt(p_code,v_hash)=v_hash;
  insert into public.admin_claim_attempts(user_id,success) values(v_uid,v_ok);

  if not v_ok then
    select count(*)::int into v_failed from public.admin_claim_attempts a
    where a.user_id=v_uid and a.success=false and a.attempted_at > now() - interval '15 minutes';
    return jsonb_build_object('ok',false,'locked',(v_failed>=5),'message',case when v_failed>=5 then 'Código incorreto. Limite de tentativas atingido; aguarde 15 minutos.' else 'Código da Equipe inválido.' end);
  end if;

  update public.profiles set role='admin' where id=v_uid and role='player';
  insert into public.admin_activity_log(actor_id,target_id,action,details)
  values(v_uid,v_uid,'self_promote_admin',jsonb_build_object('method','team_code'));
  return jsonb_build_object('ok',true,'role','admin','message','Acesso ADM ativado.');
end;
$$;

create or replace function public.owner_team_status()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare v_uid uuid:=auth.uid(); v_enabled boolean; v_hash text; v_admins integer; v_owners integer;
begin
  if not public.is_owner(v_uid) then raise exception 'Acesso exclusivo do Owner.'; end if;
  select admin_signup_enabled,admin_code_hash into v_enabled,v_hash from public.team_settings where id=1;
  select count(*)::int into v_admins from public.profiles where role='admin';
  select count(*)::int into v_owners from public.profiles where role='owner';
  return jsonb_build_object('admin_signup_enabled',coalesce(v_enabled,false),'code_configured',(v_hash is not null and v_hash<>''),'admin_count',v_admins,'owner_count',v_owners);
end;
$$;

create or replace function public.owner_set_admin_code(p_new_code text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare v_uid uuid:=auth.uid();
begin
  if not public.is_owner(v_uid) then raise exception 'Acesso exclusivo do Owner.'; end if;
  if char_length(coalesce(p_new_code,'')) < 10 then return jsonb_build_object('ok',false,'message','O Código da Equipe precisa ter pelo menos 10 caracteres.'); end if;
  update public.team_settings set admin_code_hash=extensions.crypt(p_new_code,extensions.gen_salt('bf',10)),updated_at=now(),updated_by=v_uid where id=1;
  insert into public.admin_activity_log(actor_id,action,details) values(v_uid,'rotate_admin_code',jsonb_build_object('admin_signup_enabled',(select admin_signup_enabled from public.team_settings where id=1)));
  return jsonb_build_object('ok',true);
end;
$$;

create or replace function public.owner_set_admin_signup(p_enabled boolean)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare v_uid uuid:=auth.uid();
begin
  if not public.is_owner(v_uid) then raise exception 'Acesso exclusivo do Owner.'; end if;
  update public.team_settings set admin_signup_enabled=coalesce(p_enabled,false),updated_at=now(),updated_by=v_uid where id=1;
  insert into public.admin_activity_log(actor_id,action,details) values(v_uid,'set_admin_signup',jsonb_build_object('enabled',coalesce(p_enabled,false)));
  return jsonb_build_object('ok',true,'enabled',coalesce(p_enabled,false));
end;
$$;

create or replace function public.owner_set_user_role(p_target uuid,p_role text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare v_uid uuid:=auth.uid(); v_old text; v_name text;
begin
  if not public.is_owner(v_uid) then raise exception 'Acesso exclusivo do Owner.'; end if;
  if p_role not in ('player','admin') then return jsonb_build_object('ok',false,'message','O Owner só pode alternar contas entre Player e ADM por este painel.'); end if;
  select role,username into v_old,v_name from public.profiles where id=p_target for update;
  if v_old is null then return jsonb_build_object('ok',false,'message','Conta não encontrada.'); end if;
  if v_old='owner' then return jsonb_build_object('ok',false,'message','Outro Owner não pode ser alterado por esta função.'); end if;
  update public.profiles set role=p_role where id=p_target;
  insert into public.admin_activity_log(actor_id,target_id,action,details) values(v_uid,p_target,'set_user_role',jsonb_build_object('username',v_name,'before',v_old,'after',p_role));
  return jsonb_build_object('ok',true,'before',v_old,'after',p_role);
end;
$$;

-- =========================================================
-- RPC: CRIAR PERSONAGEM (máximo 2 ativos)
-- =========================================================
create or replace function public.create_character(
  p_nome text,
  p_faccao text default 'Pirata',
  p_cargo text default ''
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_slot smallint;
  v_char public.characters;
begin
  if v_uid is null then raise exception 'Não autenticado.'; end if;
  if trim(coalesce(p_nome,'')) = '' then raise exception 'Nome obrigatório.'; end if;

  if (select count(*) from public.characters where owner_id=v_uid and status='Ativo') >= 2 then
    raise exception 'Limite de 2 personagens ativos atingido.';
  end if;

  select s into v_slot
  from (values (1::smallint),(2::smallint)) x(s)
  where not exists (
    select 1 from public.characters c where c.owner_id=v_uid and c.status='Ativo' and c.slot=x.s
  )
  order by s limit 1;

  insert into public.characters(owner_id,slot,nome,faccao,cargo)
  values(v_uid,v_slot,trim(p_nome),coalesce(nullif(trim(p_faccao),''),'Pirata'),coalesce(p_cargo,''))
  returning * into v_char;

  insert into public.change_log(character_id,owner_id,actor_id,actor_role,change_type,origin,reference,changes,before_state,after_state,audit_status)
  values(v_char.id,v_uid,v_uid,'system','creation','Criação de ficha','Atributos iniciados em 0.',
    jsonb_build_object('slot',v_slot), '{}'::jsonb, to_jsonb(v_char), 'Dispensado');

  return to_jsonb(v_char);
end;
$$;

-- =========================================================
-- RPC: ALTERAÇÃO MECÂNICA PELO PLAYER
-- =========================================================
create or replace function public.player_mechanical_update(
  p_character_id uuid,
  p_attr_delta jsonb default '{}'::jsonb,
  p_buff_delta jsonb default '{}'::jsonb,
  p_haki_delta numeric default 0,
  p_akuma_delta numeric default 0,
  p_origin text default 'Atualização',
  p_reference text default ''
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  b public.characters;
  a public.characters;
  df bigint := coalesce((p_attr_delta->>'for')::bigint,0);
  dr bigint := coalesce((p_attr_delta->>'res')::bigint,0);
  da bigint := coalesce((p_attr_delta->>'agi')::bigint,0);
  dp bigint := coalesce((p_attr_delta->>'pre')::bigint,0);
  di bigint := coalesce((p_attr_delta->>'int')::bigint,0);
  de bigint := coalesce((p_attr_delta->>'esp')::bigint,0);
  bf integer := coalesce((p_buff_delta->>'for')::integer,0);
  br integer := coalesce((p_buff_delta->>'res')::integer,0);
  ba integer := coalesce((p_buff_delta->>'agi')::integer,0);
  bp integer := coalesce((p_buff_delta->>'pre')::integer,0);
  bi integer := coalesce((p_buff_delta->>'int')::integer,0);
  be integer := coalesce((p_buff_delta->>'esp')::integer,0);
  v_log public.change_log;
begin
  if v_uid is null then raise exception 'Não autenticado.'; end if;
  if trim(coalesce(p_reference,'')) = '' then raise exception 'A referência da alteração é obrigatória.'; end if;

  select * into b from public.characters
  where id=p_character_id and owner_id=v_uid and status='Ativo'
  for update;
  if not found then raise exception 'Personagem não encontrado ou não pertence à sua conta.'; end if;

  update public.characters set
    attr_for=greatest(0,b.attr_for+df), attr_res=greatest(0,b.attr_res+dr),
    attr_agi=greatest(0,b.attr_agi+da), attr_pre=greatest(0,b.attr_pre+dp),
    attr_int=greatest(0,b.attr_int+di), attr_esp=greatest(0,b.attr_esp+de),
    buff_for=greatest(0,b.buff_for+bf), buff_res=greatest(0,b.buff_res+br),
    buff_agi=greatest(0,b.buff_agi+ba), buff_pre=greatest(0,b.buff_pre+bp),
    buff_int=greatest(0,b.buff_int+bi), buff_esp=greatest(0,b.buff_esp+be),
    haki_bonus=greatest(0,b.haki_bonus+coalesce(p_haki_delta,0)),
    akuma_bonus=greatest(0,b.akuma_bonus+coalesce(p_akuma_delta,0))
  where id=b.id returning * into a;

  insert into public.change_log(character_id,owner_id,actor_id,actor_role,change_type,origin,reference,changes,before_state,after_state,audit_status)
  values(a.id,a.owner_id,v_uid,'player','mechanical',coalesce(nullif(trim(p_origin),''),'Atualização'),trim(p_reference),
    jsonb_build_object('attributes',coalesce(p_attr_delta,'{}'::jsonb),'buffs',coalesce(p_buff_delta,'{}'::jsonb),'haki_bonus',coalesce(p_haki_delta,0),'akuma_bonus',coalesce(p_akuma_delta,0)),
    to_jsonb(b),to_jsonb(a),'Pendente') returning * into v_log;

  return jsonb_build_object('character',to_jsonb(a),'log',to_jsonb(v_log));
exception
  when check_violation then
    raise exception 'O limite global de 1000%% de buffs comuns seria ultrapassado.';
end;
$$;

-- =========================================================
-- RPC: DADOS GERAIS PELO PLAYER
-- =========================================================
create or replace function public.player_metadata_update(
  p_character_id uuid,
  p_values jsonb,
  p_origin text default 'Atualização cadastral',
  p_reference text default ''
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  b public.characters;
  a public.characters;
  v_log public.change_log;
begin
  if v_uid is null then raise exception 'Não autenticado.'; end if;
  if trim(coalesce(p_reference,'')) = '' then raise exception 'A referência da alteração é obrigatória.'; end if;

  select * into b from public.characters where id=p_character_id and owner_id=v_uid and status='Ativo' for update;
  if not found then raise exception 'Personagem não encontrado ou não pertence à sua conta.'; end if;

  update public.characters set
    faccao=coalesce(p_values->>'faccao',b.faccao),
    cargo=coalesce(p_values->>'cargo',b.cargo),
    berries=case when p_values ? 'berries' then greatest(0,(p_values->>'berries')::bigint) else b.berries end,
    raca=coalesce(p_values->>'raca',b.raca),
    linhagem=coalesce(p_values->>'linhagem',b.linhagem),
    profissao=coalesce(p_values->>'profissao',b.profissao),
    subprofissao=coalesce(p_values->>'subprofissao',b.subprofissao),
    edl=coalesce(p_values->>'edl',b.edl),
    akuma_nome=coalesce(p_values->>'akuma_nome',b.akuma_nome),
    localizacao=coalesce(p_values->>'localizacao',b.localizacao),
    navio=coalesce(p_values->>'navio',b.navio)
  where id=b.id returning * into a;

  if (to_jsonb(b) - 'updated_at') = (to_jsonb(a) - 'updated_at') then raise exception 'Nenhum dado foi alterado.'; end if;

  insert into public.change_log(character_id,owner_id,actor_id,actor_role,change_type,origin,reference,changes,before_state,after_state,audit_status)
  values(a.id,a.owner_id,v_uid,'player','metadata',coalesce(nullif(trim(p_origin),''),'Atualização cadastral'),trim(p_reference),coalesce(p_values,'{}'::jsonb),to_jsonb(b),to_jsonb(a),'Pendente')
  returning * into v_log;
  return jsonb_build_object('character',to_jsonb(a),'log',to_jsonb(v_log));
end;
$$;

-- =========================================================
-- RPC: MORTE / ARQUIVAMENTO PELO PLAYER
-- =========================================================
create or replace function public.player_archive_death(p_character_id uuid, p_reference text default 'Morte permanente')
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid(); b public.characters; a public.characters; v_log public.change_log;
begin
  if v_uid is null then raise exception 'Não autenticado.'; end if;
  select * into b from public.characters where id=p_character_id and owner_id=v_uid and status='Ativo' for update;
  if not found then raise exception 'Personagem não encontrado.'; end if;
  update public.characters set status='Falecido',slot=null where id=b.id returning * into a;
  insert into public.change_log(character_id,owner_id,actor_id,actor_role,change_type,origin,reference,changes,before_state,after_state,audit_status)
  values(a.id,a.owner_id,v_uid,'player','death','Morte permanente',coalesce(nullif(trim(p_reference),''),'Morte permanente'),jsonb_build_object('status','Falecido'),to_jsonb(b),to_jsonb(a),'Pendente') returning * into v_log;
  return jsonb_build_object('character',to_jsonb(a),'log',to_jsonb(v_log));
end;
$$;

-- =========================================================
-- RPC: AUDITORIA ADM
-- =========================================================
create or replace function public.admin_audit_change(p_log_id uuid,p_status text,p_note text default '')
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare v_uid uuid:=auth.uid(); v_log public.change_log;
begin
  if not public.is_admin(v_uid) then raise exception 'Acesso negado.'; end if;
  if p_status not in ('Pendente','Conferido','Sinalizado') then raise exception 'Status de auditoria inválido.'; end if;
  update public.change_log set audit_status=p_status,audit_by=v_uid,audit_at=now(),audit_note=coalesce(p_note,'')
  where id=p_log_id returning * into v_log;
  if not found then raise exception 'Alteração não encontrada.'; end if;
  return to_jsonb(v_log);
end;
$$;

-- =========================================================
-- RPC: CORREÇÃO MECÂNICA ADM
-- =========================================================
create or replace function public.admin_mechanical_correction(
  p_character_id uuid,
  p_attr_delta jsonb default '{}'::jsonb,
  p_buff_delta jsonb default '{}'::jsonb,
  p_haki_delta numeric default 0,
  p_akuma_delta numeric default 0,
  p_reference text default ''
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid:=auth.uid(); b public.characters; a public.characters; v_log public.change_log;
  df bigint:=coalesce((p_attr_delta->>'for')::bigint,0); dr bigint:=coalesce((p_attr_delta->>'res')::bigint,0);
  da bigint:=coalesce((p_attr_delta->>'agi')::bigint,0); dp bigint:=coalesce((p_attr_delta->>'pre')::bigint,0);
  di bigint:=coalesce((p_attr_delta->>'int')::bigint,0); de bigint:=coalesce((p_attr_delta->>'esp')::bigint,0);
  bf integer:=coalesce((p_buff_delta->>'for')::integer,0); br integer:=coalesce((p_buff_delta->>'res')::integer,0);
  ba integer:=coalesce((p_buff_delta->>'agi')::integer,0); bp integer:=coalesce((p_buff_delta->>'pre')::integer,0);
  bi integer:=coalesce((p_buff_delta->>'int')::integer,0); be integer:=coalesce((p_buff_delta->>'esp')::integer,0);
begin
  if not public.is_admin(v_uid) then raise exception 'Acesso negado.'; end if;
  if trim(coalesce(p_reference,''))='' then raise exception 'Motivo da correção obrigatório.'; end if;
  select * into b from public.characters where id=p_character_id and status='Ativo' for update;
  if not found then raise exception 'Personagem não encontrado.'; end if;

  update public.characters set
    attr_for=greatest(0,b.attr_for+df),attr_res=greatest(0,b.attr_res+dr),attr_agi=greatest(0,b.attr_agi+da),
    attr_pre=greatest(0,b.attr_pre+dp),attr_int=greatest(0,b.attr_int+di),attr_esp=greatest(0,b.attr_esp+de),
    buff_for=greatest(0,b.buff_for+bf),buff_res=greatest(0,b.buff_res+br),buff_agi=greatest(0,b.buff_agi+ba),
    buff_pre=greatest(0,b.buff_pre+bp),buff_int=greatest(0,b.buff_int+bi),buff_esp=greatest(0,b.buff_esp+be),
    haki_bonus=greatest(0,b.haki_bonus+coalesce(p_haki_delta,0)),akuma_bonus=greatest(0,b.akuma_bonus+coalesce(p_akuma_delta,0))
  where id=b.id returning * into a;

  insert into public.change_log(character_id,owner_id,actor_id,actor_role,change_type,origin,reference,changes,before_state,after_state,audit_status,audit_by,audit_at)
  values(a.id,a.owner_id,v_uid,'admin','admin_correction','Correção Administrativa',trim(p_reference),
    jsonb_build_object('attributes',coalesce(p_attr_delta,'{}'::jsonb),'buffs',coalesce(p_buff_delta,'{}'::jsonb),'haki_bonus',coalesce(p_haki_delta,0),'akuma_bonus',coalesce(p_akuma_delta,0)),
    to_jsonb(b),to_jsonb(a),'Dispensado',v_uid,now()) returning * into v_log;
  return jsonb_build_object('character',to_jsonb(a),'log',to_jsonb(v_log));
exception when check_violation then raise exception 'O limite global de 1000%% de buffs comuns seria ultrapassado.';
end;
$$;

-- =========================================================
-- PERMISSÕES DAS RPCs
-- =========================================================
revoke all on function public.is_admin(uuid) from public;
revoke all on function public.is_owner(uuid) from public;
revoke all on function public.claim_admin_role(text) from public;
revoke all on function public.owner_team_status() from public;
revoke all on function public.owner_set_admin_code(text) from public;
revoke all on function public.owner_set_admin_signup(boolean) from public;
revoke all on function public.owner_set_user_role(uuid,text) from public;
revoke all on function public.create_character(text,text,text) from public;
revoke all on function public.player_mechanical_update(uuid,jsonb,jsonb,numeric,numeric,text,text) from public;
revoke all on function public.player_metadata_update(uuid,jsonb,text,text) from public;
revoke all on function public.player_archive_death(uuid,text) from public;
revoke all on function public.admin_audit_change(uuid,text,text) from public;
revoke all on function public.admin_mechanical_correction(uuid,jsonb,jsonb,numeric,numeric,text) from public;

grant execute on function public.is_admin(uuid) to authenticated;
grant execute on function public.is_owner(uuid) to authenticated;
grant execute on function public.claim_admin_role(text) to authenticated;
grant execute on function public.owner_team_status() to authenticated;
grant execute on function public.owner_set_admin_code(text) to authenticated;
grant execute on function public.owner_set_admin_signup(boolean) to authenticated;
grant execute on function public.owner_set_user_role(uuid,text) to authenticated;
grant execute on function public.create_character(text,text,text) to authenticated;
grant execute on function public.player_mechanical_update(uuid,jsonb,jsonb,numeric,numeric,text,text) to authenticated;
grant execute on function public.player_metadata_update(uuid,jsonb,text,text) to authenticated;
grant execute on function public.player_archive_death(uuid,text) to authenticated;
grant execute on function public.admin_audit_change(uuid,text,text) to authenticated;
grant execute on function public.admin_mechanical_correction(uuid,jsonb,jsonb,numeric,numeric,text) to authenticated;

-- Realtime: permite que a fila ADM atualize quando um player salva.
do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='profiles') then
    alter publication supabase_realtime add table public.profiles;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='characters') then
    alter publication supabase_realtime add table public.characters;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='change_log') then
    alter publication supabase_realtime add table public.change_log;
  end if;
end $$;

-- =========================================================
-- PRIMEIRO OWNER — ÚNICA CONFIGURAÇÃO MANUAL
-- =========================================================
-- 1) Cadastre a SUA conta normalmente pelo site e confirme o e-mail.
-- 2) Troque SEU_USUARIO pelo seu nome de usuário e execute UMA VEZ:
-- update public.profiles set role='owner' where username='SEU_USUARIO';
-- 3) Entre novamente no site → Painel ADM → Acesso da Equipe → defina o Código da Equipe.
--
-- Daí em diante você NÃO precisa promover ADM por ADM no Supabase:
-- cada membro da equipe usa o Código da Equipe no cadastro, login ou em “Ativar acesso ADM”.
-- O código real nunca fica no GitHub; somente o hash bcrypt permanece no banco.
--
-- Segurança incluída: e-mail confirmado, 5 erros/15 min por conta, Owner pode pausar
-- novas ativações, trocar o código e remover o papel ADM sem apagar personagens.
