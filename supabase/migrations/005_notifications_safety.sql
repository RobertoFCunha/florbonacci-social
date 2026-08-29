-- ============================================================
-- FLORBONACCI SOCIAL
-- Migration 005 — Notificações e Segurança
-- ============================================================


-- ============================================================
-- 1. NOTIFICAÇÕES
-- ============================================================

create table public.notifications (
  id uuid primary key default gen_random_uuid(),

  recipient_id uuid not null
    references public.profiles(id)
    on delete cascade,

  actor_id uuid
    references public.profiles(id)
    on delete set null,

  type text not null,

  discovery_id uuid
    references public.discoveries(id)
    on delete cascade,

  comment_id uuid
    references public.comments(id)
    on delete cascade,

  read_at timestamptz,

  created_at timestamptz not null default now(),

  constraint notifications_type_not_blank
    check (
      char_length(trim(type)) >= 1
    )
);


create index notifications_recipient_id_idx
  on public.notifications (recipient_id);

create index notifications_actor_id_idx
  on public.notifications (actor_id);

create index notifications_discovery_id_idx
  on public.notifications (discovery_id);

create index notifications_comment_id_idx
  on public.notifications (comment_id);


-- ============================================================
-- 2. BLOQUEIOS
-- ============================================================

create table public.blocks (
  blocker_id uuid not null
    references public.profiles(id)
    on delete cascade,

  blocked_id uuid not null
    references public.profiles(id)
    on delete cascade,

  created_at timestamptz not null default now(),

  primary key (blocker_id, blocked_id),

  constraint blocks_no_self_block
    check (
      blocker_id <> blocked_id
    )
);


create index blocks_blocker_id_idx
  on public.blocks (blocker_id);

create index blocks_blocked_id_idx
  on public.blocks (blocked_id);


-- ============================================================
-- 3. DENÚNCIAS
-- ============================================================

create table public.reports (
  id uuid primary key default gen_random_uuid(),

  reporter_id uuid not null
    references public.profiles(id)
    on delete cascade,

  target_type text not null,
  target_id uuid not null,

  reason text not null,
  description text,

  status text not null default 'pending',

  reviewed_by uuid
    references public.profiles(id)
    on delete set null,

  reviewed_at timestamptz,

  created_at timestamptz not null default now(),

  constraint reports_target_type_check
    check (
      target_type in (
        'profile',
        'discovery',
        'comment'
      )
    ),

  constraint reports_reason_not_blank
    check (
      char_length(trim(reason)) >= 1
    ),

  constraint reports_status_check
    check (
      status in (
        'pending',
        'reviewing',
        'resolved',
        'dismissed'
      )
    )
);


create index reports_reporter_id_idx
  on public.reports (reporter_id);

create index reports_target_idx
  on public.reports (
    target_type,
    target_id
  );

create index reports_status_idx
  on public.reports (status);


-- ============================================================
-- 4. ROW LEVEL SECURITY
-- ============================================================

alter table public.notifications
enable row level security;

alter table public.blocks
enable row level security;

alter table public.reports
enable row level security;


-- ============================================================
-- 5. POLICIES — NOTIFICATIONS
-- ============================================================

create policy "notifications_select_own"
on public.notifications
for select
to authenticated
using (
  recipient_id = auth.uid()
);


create policy "notifications_update_own"
on public.notifications
for update
to authenticated
using (
  recipient_id = auth.uid()
)
with check (
  recipient_id = auth.uid()
);


-- Inserções de notificações não ficam abertas ao cliente.
-- Serão feitas por funções/triggers controlados pelo backend.


-- ============================================================
-- 6. POLICIES — BLOCKS
-- ============================================================

create policy "blocks_select_own"
on public.blocks
for select
to authenticated
using (
  blocker_id = auth.uid()
);


create policy "blocks_insert_own"
on public.blocks
for insert
to authenticated
with check (
  blocker_id = auth.uid()
);


create policy "blocks_delete_own"
on public.blocks
for delete
to authenticated
using (
  blocker_id = auth.uid()
);


-- ============================================================
-- 7. POLICIES — REPORTS
-- ============================================================

create policy "reports_select_own"
on public.reports
for select
to authenticated
using (
  reporter_id = auth.uid()
);


create policy "reports_insert_own"
on public.reports
for insert
to authenticated
with check (
  reporter_id = auth.uid()
);


-- Alterações de status, revisão e moderação
-- não ficam abertas ao cliente comum.


-- ============================================================
-- 8. PRIVILÉGIOS EXPLÍCITOS PARA O DATA API
-- ============================================================

grant select, update
on table public.notifications
to authenticated;

grant select, insert, delete
on table public.blocks
to authenticated;

grant select, insert
on table public.reports
to authenticated;