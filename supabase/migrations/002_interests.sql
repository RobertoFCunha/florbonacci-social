-- ============================================================
-- FLORBONACCI SOCIAL
-- Migration 002 — Interests + hardening de Profiles
-- ============================================================


-- ============================================================
-- 1. AJUSTE DE PRIVACIDADE EM PROFILES
-- ============================================================

drop policy if exists "profiles_select_active"
on public.profiles;

create policy "profiles_select_visible"
on public.profiles
for select
to authenticated
using (
  status = 'active'
  and (
    visibility = 'public'
    or auth.uid() = id
  )
);


-- Privilégios explícitos para o Data API
grant select, insert, update
on table public.profiles
to authenticated;


-- ============================================================
-- 2. TABELA DE INTERESSES
-- ============================================================

create table public.interests (
  id uuid primary key default gen_random_uuid(),

  name text not null,
  slug text not null unique,
  description text,

  parent_id uuid
    references public.interests(id)
    on delete set null,

  image_path text,

  status text not null default 'active',

  created_at timestamptz not null default now(),

  constraint interests_name_not_blank
    check (
      char_length(trim(name)) >= 2
    ),

  constraint interests_slug_not_blank
    check (
      char_length(trim(slug)) >= 2
    ),

  constraint interests_status_check
    check (
      status in ('active', 'inactive', 'archived')
    )
);


create unique index interests_name_lower_unique
  on public.interests (lower(name));


create index interests_parent_id_idx
  on public.interests (parent_id);

create index interests_status_idx
  on public.interests (status);


-- ============================================================
-- 3. INTERESSES DE CADA PERFIL
-- ============================================================

create table public.profile_interests (
  profile_id uuid not null
    references public.profiles(id)
    on delete cascade,

  interest_id uuid not null
    references public.interests(id)
    on delete cascade,

  weight numeric(5,2) not null default 1.00,

  source text not null default 'selected',

  created_at timestamptz not null default now(),

  primary key (profile_id, interest_id),

  constraint profile_interests_weight_check
    check (
      weight >= 0
      and weight <= 100
    ),

  constraint profile_interests_source_check
    check (
      source in ('selected', 'behavior', 'suggested')
    )
);


create index profile_interests_profile_id_idx
  on public.profile_interests (profile_id);

create index profile_interests_interest_id_idx
  on public.profile_interests (interest_id);


-- ============================================================
-- 4. ROW LEVEL SECURITY
-- ============================================================

alter table public.interests
enable row level security;

alter table public.profile_interests
enable row level security;


-- ============================================================
-- 5. POLICIES — INTERESTS
-- ============================================================

create policy "interests_select_active"
on public.interests
for select
to authenticated
using (
  status = 'active'
);


-- ============================================================
-- 6. POLICIES — PROFILE_INTERESTS
-- ============================================================

create policy "profile_interests_select_visible"
on public.profile_interests
for select
to authenticated
using (
  profile_id = auth.uid()
  or exists (
    select 1
    from public.profiles p
    where p.id = profile_interests.profile_id
      and p.status = 'active'
      and p.visibility = 'public'
  )
);


create policy "profile_interests_insert_own"
on public.profile_interests
for insert
to authenticated
with check (
  profile_id = auth.uid()
);


create policy "profile_interests_update_own"
on public.profile_interests
for update
to authenticated
using (
  profile_id = auth.uid()
)
with check (
  profile_id = auth.uid()
);


create policy "profile_interests_delete_own"
on public.profile_interests
for delete
to authenticated
using (
  profile_id = auth.uid()
);


-- ============================================================
-- 7. PRIVILÉGIOS EXPLÍCITOS PARA O DATA API
-- ============================================================

grant select
on table public.interests
to authenticated;

grant select, insert, update, delete
on table public.profile_interests
to authenticated;