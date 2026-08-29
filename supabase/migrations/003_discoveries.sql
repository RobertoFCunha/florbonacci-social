-- ============================================================
-- FLORBONACCI SOCIAL
-- Migration 003 — Núcleo das Descobertas
-- ============================================================


-- ============================================================
-- 1. DESCOBERTAS
-- ============================================================

create table public.discoveries (
  id uuid primary key default gen_random_uuid(),

  author_id uuid not null
    references public.profiles(id)
    on delete cascade,

  title text,
  body text not null,

  visibility text not null default 'public',
  status text not null default 'published',

  public_city text,
  public_state text,
  public_country text,

  location_precision text not null default 'none',

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz,

  constraint discoveries_body_not_blank
    check (
      char_length(trim(body)) >= 1
    ),

  constraint discoveries_visibility_check
    check (
      visibility in ('public', 'private')
    ),

  constraint discoveries_status_check
    check (
      status in (
        'draft',
        'published',
        'archived',
        'deleted'
      )
    ),

  constraint discoveries_location_precision_check
    check (
      location_precision in (
        'none',
        'country',
        'state',
        'city',
        'precise'
      )
    )
);


create trigger discoveries_set_updated_at
before update on public.discoveries
for each row
execute function public.set_updated_at();


-- ============================================================
-- 2. MÍDIAS DAS DESCOBERTAS
-- ============================================================

create table public.discovery_media (
  id uuid primary key default gen_random_uuid(),

  discovery_id uuid not null
    references public.discoveries(id)
    on delete cascade,

  media_type text not null default 'image',

  storage_path text not null,
  thumbnail_path text,

  width integer,
  height integer,

  file_size bigint,
  mime_type text,

  position integer not null default 0,

  created_at timestamptz not null default now(),

  constraint discovery_media_type_check
    check (
      media_type in ('image', 'video')
    ),

  constraint discovery_media_position_check
    check (
      position >= 0
    ),

  constraint discovery_media_width_check
    check (
      width is null or width > 0
    ),

  constraint discovery_media_height_check
    check (
      height is null or height > 0
    ),

  constraint discovery_media_file_size_check
    check (
      file_size is null or file_size >= 0
    )
);


create index discovery_media_discovery_id_idx
  on public.discovery_media (discovery_id);

create index discovery_media_position_idx
  on public.discovery_media (
    discovery_id,
    position
  );


-- ============================================================
-- 3. INTERESSES ASSOCIADOS À DESCOBERTA
-- ============================================================

create table public.discovery_interests (
  discovery_id uuid not null
    references public.discoveries(id)
    on delete cascade,

  interest_id uuid not null
    references public.interests(id)
    on delete cascade,

  created_at timestamptz not null default now(),

  primary key (
    discovery_id,
    interest_id
  )
);


create index discovery_interests_discovery_id_idx
  on public.discovery_interests (discovery_id);

create index discovery_interests_interest_id_idx
  on public.discovery_interests (interest_id);


-- ============================================================
-- 4. LOCALIZAÇÃO PRECISA DA DESCOBERTA
-- ============================================================

create table public.discovery_locations (
  discovery_id uuid primary key
    references public.discoveries(id)
    on delete cascade,

  latitude double precision not null,
  longitude double precision not null,

  city text,
  state text,
  country text,

  public_precision text not null default 'none',

  created_at timestamptz not null default now(),

  constraint discovery_locations_latitude_check
    check (
      latitude between -90 and 90
    ),

  constraint discovery_locations_longitude_check
    check (
      longitude between -180 and 180
    ),

  constraint discovery_locations_public_precision_check
    check (
      public_precision in (
        'none',
        'country',
        'state',
        'city',
        'precise'
      )
    )
);


-- ============================================================
-- 5. ROW LEVEL SECURITY
-- ============================================================

alter table public.discoveries
enable row level security;

alter table public.discovery_media
enable row level security;

alter table public.discovery_interests
enable row level security;

alter table public.discovery_locations
enable row level security;


-- ============================================================
-- 6. POLICIES — DISCOVERIES
-- ============================================================

create policy "discoveries_select_visible"
on public.discoveries
for select
to authenticated
using (
  author_id = auth.uid()
  or (
    status = 'published'
    and visibility = 'public'
  )
);


create policy "discoveries_insert_own"
on public.discoveries
for insert
to authenticated
with check (
  author_id = auth.uid()
);


create policy "discoveries_update_own"
on public.discoveries
for update
to authenticated
using (
  author_id = auth.uid()
)
with check (
  author_id = auth.uid()
);


-- Exclusão física não é exposta ao cliente.
-- O fluxo normal deve usar status = 'deleted'.


-- ============================================================
-- 7. POLICIES — DISCOVERY_MEDIA
-- ============================================================

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
        )
      )
  )
);


create policy "discovery_media_insert_own"
on public.discovery_media
for insert
to authenticated
with check (
  exists (
    select 1
    from public.discoveries d
    where d.id = discovery_media.discovery_id
      and d.author_id = auth.uid()
  )
);


create policy "discovery_media_update_own"
on public.discovery_media
for update
to authenticated
using (
  exists (
    select 1
    from public.discoveries d
    where d.id = discovery_media.discovery_id
      and d.author_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.discoveries d
    where d.id = discovery_media.discovery_id
      and d.author_id = auth.uid()
  )
);


create policy "discovery_media_delete_own"
on public.discovery_media
for delete
to authenticated
using (
  exists (
    select 1
    from public.discoveries d
    where d.id = discovery_media.discovery_id
      and d.author_id = auth.uid()
  )
);


-- ============================================================
-- 8. POLICIES — DISCOVERY_INTERESTS
-- ============================================================

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
        )
      )
  )
);


create policy "discovery_interests_insert_own"
on public.discovery_interests
for insert
to authenticated
with check (
  exists (
    select 1
    from public.discoveries d
    where d.id = discovery_interests.discovery_id
      and d.author_id = auth.uid()
  )
);


create policy "discovery_interests_delete_own"
on public.discovery_interests
for delete
to authenticated
using (
  exists (
    select 1
    from public.discoveries d
    where d.id = discovery_interests.discovery_id
      and d.author_id = auth.uid()
  )
);


-- ============================================================
-- 9. POLICIES — DISCOVERY_LOCATIONS
-- ============================================================

-- A localização precisa fica restrita ao autor da descoberta.

create policy "discovery_locations_select_own"
on public.discovery_locations
for select
to authenticated
using (
  exists (
    select 1
    from public.discoveries d
    where d.id = discovery_locations.discovery_id
      and d.author_id = auth.uid()
  )
);


create policy "discovery_locations_insert_own"
on public.discovery_locations
for insert
to authenticated
with check (
  exists (
    select 1
    from public.discoveries d
    where d.id = discovery_locations.discovery_id
      and d.author_id = auth.uid()
  )
);


create policy "discovery_locations_update_own"
on public.discovery_locations
for update
to authenticated
using (
  exists (
    select 1
    from public.discoveries d
    where d.id = discovery_locations.discovery_id
      and d.author_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.discoveries d
    where d.id = discovery_locations.discovery_id
      and d.author_id = auth.uid()
  )
);


create policy "discovery_locations_delete_own"
on public.discovery_locations
for delete
to authenticated
using (
  exists (
    select 1
    from public.discoveries d
    where d.id = discovery_locations.discovery_id
      and d.author_id = auth.uid()
  )
);


-- ============================================================
-- 10. PRIVILÉGIOS EXPLÍCITOS PARA O DATA API
-- ============================================================

grant select, insert, update
on table public.discoveries
to authenticated;

grant select, insert, update, delete
on table public.discovery_media
to authenticated;

grant select, insert, delete
on table public.discovery_interests
to authenticated;

grant select, insert, update, delete
on table public.discovery_locations
to authenticated;