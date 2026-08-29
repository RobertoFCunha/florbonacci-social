-- ============================================================
-- FLORBONACCI SOCIAL
-- Migration 010 — Notificações automáticas
-- ============================================================
--
-- Gera notificações para:
--   1. novo seguidor
--   2. ✨ Encantou
--   3. comentário em uma descoberta
--   4. resposta a um comentário
--
-- Regras:
--   - ninguém recebe notificação de si mesmo;
--   - bloqueios impedem a geração da notificação;
--   - notificações são criadas pelo banco, não pelo cliente.
-- ============================================================


-- ============================================================
-- 1. FUNÇÃO CENTRAL PARA CRIAR NOTIFICAÇÃO
-- ============================================================

create or replace function public.create_social_notification(
  p_recipient_id uuid,
  p_actor_id uuid,
  p_type text,
  p_discovery_id uuid default null,
  p_comment_id uuid default null
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  -- Dados essenciais ausentes: não cria.
  if p_recipient_id is null
     or p_actor_id is null then
    return;
  end if;

  -- Não notificar ações da própria pessoa.
  if p_recipient_id = p_actor_id then
    return;
  end if;

  -- Não gerar notificações entre pessoas bloqueadas.
  if public.has_block_between(
    p_recipient_id,
    p_actor_id
  ) then
    return;
  end if;

  insert into public.notifications (
    recipient_id,
    actor_id,
    type,
    discovery_id,
    comment_id
  )
  values (
    p_recipient_id,
    p_actor_id,
    p_type,
    p_discovery_id,
    p_comment_id
  );
end;
$$;


revoke all
on function public.create_social_notification(
  uuid,
  uuid,
  text,
  uuid,
  uuid
)
from public;


-- ============================================================
-- 2. NOVO SEGUIDOR
-- ============================================================

create or replace function public.notify_new_follower()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  perform public.create_social_notification(
    new.following_id,
    new.follower_id,
    'follow',
    null,
    null
  );

  return new;
end;
$$;


drop trigger if exists follows_notify_insert
on public.follows;

create trigger follows_notify_insert
after insert on public.follows
for each row
execute function public.notify_new_follower();


-- ============================================================
-- 3. ✨ ENCANTOU
-- ============================================================

create or replace function public.notify_new_reaction()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_author_id uuid;
begin
  select d.author_id
  into v_author_id
  from public.discoveries d
  where d.id = new.discovery_id;

  if v_author_id is null then
    return new;
  end if;

  perform public.create_social_notification(
    v_author_id,
    new.profile_id,
    'enchanted',
    new.discovery_id,
    null
  );

  return new;
end;
$$;


drop trigger if exists reactions_notify_insert
on public.reactions;

create trigger reactions_notify_insert
after insert on public.reactions
for each row
execute function public.notify_new_reaction();


-- ============================================================
-- 4. COMENTÁRIO OU RESPOSTA
-- ============================================================

create or replace function public.notify_new_comment()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_discovery_author_id uuid;
  v_parent_author_id uuid;
begin
  -- Descobre o autor da descoberta.
  select d.author_id
  into v_discovery_author_id
  from public.discoveries d
  where d.id = new.discovery_id;

  -- Comentário principal:
  -- notifica o autor da descoberta.
  if new.parent_comment_id is null then

    perform public.create_social_notification(
      v_discovery_author_id,
      new.author_id,
      'comment',
      new.discovery_id,
      new.id
    );

    return new;
  end if;


  -- Resposta:
  -- identifica o autor do comentário respondido.
  select c.author_id
  into v_parent_author_id
  from public.comments c
  where c.id = new.parent_comment_id;


  -- Notifica quem recebeu a resposta.
  perform public.create_social_notification(
    v_parent_author_id,
    new.author_id,
    'reply',
    new.discovery_id,
    new.id
  );


  -- Se o autor da descoberta for uma terceira pessoa,
  -- também o avisamos de que surgiu uma nova interação.
  if v_discovery_author_id is not null
     and v_discovery_author_id <> new.author_id
     and v_discovery_author_id
         is distinct from v_parent_author_id then

    perform public.create_social_notification(
      v_discovery_author_id,
      new.author_id,
      'comment',
      new.discovery_id,
      new.id
    );

  end if;

  return new;
end;
$$;


drop trigger if exists comments_notify_insert
on public.comments;

create trigger comments_notify_insert
after insert on public.comments
for each row
execute function public.notify_new_comment();


-- ============================================================
-- FIM DA MIGRATION 010
-- ============================================================