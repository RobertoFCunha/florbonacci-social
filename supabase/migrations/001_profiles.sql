-- ============================================================
-- FLORBONACCI SOCIAL
-- Migration 001 — Profiles
-- ============================================================

-- 1. Tabela de perfis
create table public.profiles (
  id uuid primary key
    references auth.users(id)
    on delete cascade,

  username text unique,
  display_name text,
  bio text,
  avatar_path text,

  city text,
  state text,
  country text,

  account_type text not null default 'person',
  visibility text not null default 'public',
  status text not null default 'active',

  birth_date date,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint profiles_username_length
    check (
      username is null
      or char_length(username) between 3 and 30
    ),

  constraint profiles_visibility_check
    check (
      visibility in ('public', 'private')
    ),

  constraint profiles_status_check
    check (
      status in ('active', 'suspended', 'deleted')
    )
);


-- 2. Índices
create unique index profiles_username_lower_unique
  on public.profiles (lower(username))
  where username is not null;

create index profiles_status_idx
  on public.profiles (status);


-- 3. Função genérica para updated_at
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;


-- 4. Trigger de atualização
create trigger profiles_set_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();


-- 5. Ativar Row Level Security
alter table public.profiles
enable row level security;


-- 6. Leitura de perfis ativos
create policy "profiles_select_active"
on public.profiles
for select
to authenticated
using (
  status = 'active'
);


-- 7. Usuário pode criar somente o próprio perfil
create policy "profiles_insert_own"
on public.profiles
for insert
to authenticated
with check (
  auth.uid() = id
);


-- 8. Usuário pode atualizar somente o próprio perfil
create policy "profiles_update_own"
on public.profiles
for update
to authenticated
using (
  auth.uid() = id
)
with check (
  auth.uid() = id
);