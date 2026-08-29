-- ============================================================
-- FLORBONACCI SOCIAL
-- Migration 009 — RLS consciente de bloqueios
-- ============================================================
--
-- Objetivo:
-- impedir que duas pessoas que possuam um bloqueio entre si
-- continuem se encontrando no grafo social, nas descobertas
-- e nas principais interações públicas.
--
-- A função has_block_between() é SECURITY DEFINER para poder
-- consultar public.blocks sem provocar recursão nas próprias
-- policies de RLS da tabela blocks.
-- ============================================================


-- ============================================================
-- 1. FUNÇÃO CENTRAL DE BLOQUEIO
-- ============================================================

create or replace function public.has_block_between(
  user_a uuid,
  user_b uuid
)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select
    case
      when user_a is null or user_b is null then false
      when user_a = user_b then false
      else exists (
        select 1
        from public.blocks b
        where
          (
            b.blocker_id = user_a
            and b.blocked_id = user_b
          )
          or
          (
            b.blocker_id = user_b
            and b.blocked_id = user_a
          )
      )
    end;
$$;


revoke all
on function public.has_block_between(uuid, uuid)
from public;

grant execute
on function public.has_block_between(uuid, uuid)
to authenticated;


-- ============================================================
-- 2. PROFILES
-- ============================================================

drop policy if exists "profiles_select_visible"
on public.profiles;

create policy "profiles_select_visible"
on public.profiles
for select
to authenticated
using (
  auth.uid() = id
  or (
    status = 'active'
    and visibility = 'public'
    and not public.has_block_between(
      auth.uid(),
      id
    )
  )
);


-- ============================================================
-- 3. PROFILE_INTERESTS
-- ============================================================

drop policy if exists "profile_interests_select_visible"
on public.profile_interests;

create policy "profile_interests_select_visible"
on public.profile_interests
for select
to authenticated
using (
  profile_id = auth.uid()
  or (
    not public.has_block_between(
      auth.uid(),
      profile_id
    )
    and exists (
      select 1
      from public.profiles p
      where p.id = profile_interests.profile_id
        and p.status = 'active'
        and p.visibility = 'public'
    )
  )
);


-- ============================================================
-- 4. DISCOVERIES
-- ============================================================

drop policy if exists "discoveries_select_visible"
on public.discoveries;

create policy "discoveries_select_visible"
on public.discoveries
for select
to authenticated
using (
  author_id = auth.uid()
  or (
    status = 'published'
    and visibility = 'public'
    and not public.has_block_between(
      auth.uid(),
      author_id
    )
  )
);


-- ============================================================
-- 5. DISCOVERY_MEDIA
-- ============================================================

drop policy if exists "discovery_media_select_visible"
on public.discovery_media;

create policy "discovery_media_select_visible"
on public.discovery_media
for select
to authenticated
using (
  exists (
    select 1
    from public.discoveries d
    where d.id = discovery_media.discovery_id
      and (
        d.author_id = auth.uid()
        or (
          d.status = 'published'
          and d.visibility = 'public'
          and not public.has_block_between(
            auth.uid(),
            d.author_id
          )
        )
      )
  )
);


-- ============================================================
-- 6. DISCOVERY_INTERESTS
-- ============================================================

drop policy if exists "discovery_interests_select_visible"
on public.discovery_interests;

create policy "discovery_interests_select_visible"
on public.discovery_interests
for select
to authenticated
using (
  exists (
    select 1
    from public.discoveries d
    where d.id = discovery_interests.discovery_id
      and (
        d.author_id = auth.uid()
        or (
          d.status = 'published'
          and d.visibility = 'public'
          and not public.has_block_between(
            auth.uid(),
            d.author_id
          )
        )
      )
  )
);


-- ============================================================
-- 7. FOLLOWS
-- ============================================================

drop policy if exists "follows_select_visible"
on public.follows;

create policy "follows_select_visible"
on public.follows
for select
to authenticated
using (
  not public.has_block_between(
    auth.uid(),
    follower_id
  )
  and not public.has_block_between(
    auth.uid(),
    following_id
  )
);


drop policy if exists "follows_insert_own"
on public.follows;

create policy "follows_insert_own"
on public.follows
for insert
to authenticated
with check (
  follower_id = auth.uid()
  and follower_id <> following_id
  and not public.has_block_between(
    follower_id,
    following_id
  )
);


-- ============================================================
-- 8. REACTIONS — "ENCANTOU"
-- ============================================================

drop policy if exists "reactions_select_visible"
on public.reactions;

create policy "reactions_select_visible"
on public.reactions
for select
to authenticated
using (
  not public.has_block_between(
    auth.uid(),
    profile_id
  )
  and exists (
    select 1
    from public.discoveries d
    where d.id = reactions.discovery_id
      and (
        d.author_id = auth.uid()
        or (
          d.status = 'published'
          and d.visibility = 'public'
          and not public.has_block_between(
            auth.uid(),
            d.author_id
          )
        )
      )
  )
);


drop policy if exists "reactions_insert_own"
on public.reactions;

create policy "reactions_insert_own"
on public.reactions
for insert
to authenticated
with check (
  profile_id = auth.uid()
  and exists (
    select 1
    from public.discoveries d
    where d.id = reactions.discovery_id
      and (
        d.author_id = auth.uid()
        or (
          d.status = 'published'
          and d.visibility = 'public'
          and not public.has_block_between(
            auth.uid(),
            d.author_id
          )
        )
      )
  )
);


-- ============================================================
-- 9. COMMENTS
-- ============================================================

drop policy if exists "comments_select_visible"
on public.comments;

create policy "comments_select_visible"
on public.comments
for select
to authenticated
using (
  (
    status = 'active'
    or author_id = auth.uid()
  )
  and not public.has_block_between(
    auth.uid(),
    author_id
  )
  and exists (
    select 1
    from public.discoveries d
    where d.id = comments.discovery_id
      and (
        d.author_id = auth.uid()
        or (
          d.status = 'published'
          and d.visibility = 'public'
          and not public.has_block_between(
            auth.uid(),
            d.author_id
          )
        )
      )
  )
);


drop policy if exists "comments_insert_own"
on public.comments;

create policy "comments_insert_own"
on public.comments
for insert
to authenticated
with check (
  author_id = auth.uid()
  and status = 'active'
  and exists (
    select 1
    from public.discoveries d
    where d.id = comments.discovery_id
      and (
        d.author_id = auth.uid()
        or (
          d.status = 'published'
          and d.visibility = 'public'
          and not public.has_block_between(
            auth.uid(),
            d.author_id
          )
        )
      )
  )
  and (
    parent_comment_id is null
    or exists (
      select 1
      from public.comments parent
      where parent.id = comments.parent_comment_id
        and not public.has_block_between(
          auth.uid(),
          parent.author_id
        )
    )
  )
);


-- ============================================================
-- 10. NOTIFICATIONS
-- ============================================================

drop policy if exists "notifications_select_own"
on public.notifications;

create policy "notifications_select_own"
on public.notifications
for select
to authenticated
using (
  recipient_id = auth.uid()
  and (
    actor_id is null
    or not public.has_block_between(
      recipient_id,
      actor_id
    )
  )
);


-- ============================================================
-- FIM DA MIGRATION 009
-- ============================================================