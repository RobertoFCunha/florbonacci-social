-- ============================================================
-- FLORBONACCI SOCIAL
-- Migration 004 — Interações Sociais
-- ============================================================


-- ============================================================
-- 1. SEGUIR PESSOAS
-- ============================================================

create table public.follows (
  follower_id uuid not null
    references public.profiles(id)
    on delete cascade,

  following_id uuid not null
    references public.profiles(id)
    on delete cascade,

  created_at timestamptz not null default now(),

  primary key (follower_id, following_id),

  constraint follows_no_self_follow
    check (follower_id <> following_id)
);

create index follows_follower_id_idx
  on public.follows (follower_id);

create index follows_following_id_idx
  on public.follows (following_id);


-- ============================================================
-- 2. REAÇÕES — "ENCANTOU"
-- ============================================================

create table public.reactions (
  profile_id uuid not null
    references public.profiles(id)
    on delete cascade,

  discovery_id uuid not null
    references public.discoveries(id)
    on delete cascade,

  reaction_type text not null default 'enchanted',

  created_at timestamptz not null default now(),

  primary key (profile_id, discovery_id),

  constraint reactions_type_check
    check (
      reaction_type in ('enchanted')
    )
);

create index reactions_discovery_id_idx
  on public.reactions (discovery_id);


-- ============================================================
-- 3. COMENTÁRIOS
-- ============================================================

create table public.comments (
  id uuid primary key default gen_random_uuid(),

  discovery_id uuid not null
    references public.discoveries(id)
    on delete cascade,

  author_id uuid not null
    references public.profiles(id)
    on delete cascade,

  parent_comment_id uuid
    references public.comments(id)
    on delete cascade,

  body text not null,

  status text not null default 'active',

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint comments_body_not_blank
    check (
      char_length(trim(body)) >= 1
    ),

  constraint comments_status_check
    check (
      status in ('active', 'deleted', 'hidden')
    )
);

create index comments_discovery_id_idx
  on public.comments (discovery_id);

create index comments_author_id_idx
  on public.comments (author_id);

create index comments_parent_comment_id_idx
  on public.comments (parent_comment_id);


create trigger comments_set_updated_at
before update on public.comments
for each row
execute function public.set_updated_at();


-- ============================================================
-- 4. VALIDAÇÃO DAS RESPOSTAS A COMENTÁRIOS
-- ============================================================

create or replace function public.validate_comment_parent()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
declare
  parent_discovery_id uuid;
  parent_parent_id uuid;
begin
  if new.parent_comment_id is null then
    return new;
  end if;

  select
    discovery_id,
    parent_comment_id
  into
    parent_discovery_id,
    parent_parent_id
  from public.comments
  where id = new.parent_comment_id;

  if not found then
    raise exception 'Comentário pai não encontrado.';
  end if;

  if parent_discovery_id <> new.discovery_id then
    raise exception
      'A resposta deve pertencer à mesma descoberta do comentário pai.';
  end if;

  if parent_parent_id is not null then
    raise exception
      'O Florbonacci permite apenas um nível de respostas.';
  end if;

  return new;
end;
$$;


create trigger comments_validate_parent
before insert or update of parent_comment_id, discovery_id
on public.comments
for each row
execute function public.validate_comment_parent();


-- ============================================================
-- 5. DESCOBERTAS GUARDADAS
-- ============================================================

create table public.saved_discoveries (
  profile_id uuid not null
    references public.profiles(id)
    on delete cascade,

  discovery_id uuid not null
    references public.discoveries(id)
    on delete cascade,

  created_at timestamptz not null default now(),

  primary key (profile_id, discovery_id)
);

create index saved_discoveries_profile_id_idx
  on public.saved_discoveries (profile_id);

create index saved_discoveries_discovery_id_idx
  on public.saved_discoveries (discovery_id);


-- ============================================================
-- 6. ROW LEVEL SECURITY
-- ============================================================

alter table public.follows
enable row level security;

alter table public.reactions
enable row level security;

alter table public.comments
enable row level security;

alter table public.saved_discoveries
enable row level security;


-- ============================================================
-- 7. POLICIES — FOLLOWS
-- ============================================================

create policy "follows_select"
on public.follows
for select
to authenticated
using (true);


create policy "follows_insert_own"
on public.follows
for insert
to authenticated
with check (
  follower_id = auth.uid()
);


create policy "follows_delete_own"
on public.follows
for delete
to authenticated
using (
  follower_id = auth.uid()
);


-- ============================================================
-- 8. POLICIES — REACTIONS
-- ============================================================

create policy "reactions_select"
on public.reactions
for select
to authenticated
using (
  exists (
    select 1
    from public.discoveries d
    where d.id = reactions.discovery_id
      and (
        d.author_id = auth.uid()
        or (
          d.status = 'published'
          and d.visibility = 'public'
        )
      )
  )
);


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
        )
      )
  )
);


create policy "reactions_delete_own"
on public.reactions
for delete
to authenticated
using (
  profile_id = auth.uid()
);


-- ============================================================
-- 9. POLICIES — COMMENTS
-- ============================================================

create policy "comments_select_visible"
on public.comments
for select
to authenticated
using (
  (
    status = 'active'
    or author_id = auth.uid()
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
        )
      )
  )
);


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
        )
      )
  )
);


create policy "comments_update_own"
on public.comments
for update
to authenticated
using (
  author_id = auth.uid()
)
with check (
  author_id = auth.uid()
);


-- Exclusão física não é concedida ao cliente.
-- Para remover um comentário, usar status = 'deleted'.


-- ============================================================
-- 10. POLICIES — SAVED_DISCOVERIES
-- ============================================================

create policy "saved_discoveries_select_own"
on public.saved_discoveries
for select
to authenticated
using (
  profile_id = auth.uid()
);


create policy "saved_discoveries_insert_own"
on public.saved_discoveries
for insert
to authenticated
with check (
  profile_id = auth.uid()
);


create policy "saved_discoveries_delete_own"
on public.saved_discoveries
for delete
to authenticated
using (
  profile_id = auth.uid()
);


-- ============================================================
-- 11. PRIVILÉGIOS EXPLÍCITOS PARA O DATA API
-- ============================================================

grant select, insert, delete
on table public.follows
to authenticated;

grant select, insert, delete
on table public.reactions
to authenticated;

grant select, insert, update
on table public.comments
to authenticated;

grant select, insert, delete
on table public.saved_discoveries
to authenticated;