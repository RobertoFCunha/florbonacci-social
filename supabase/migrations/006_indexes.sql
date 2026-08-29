-- ============================================================
-- FLORBONACCI SOCIAL
-- Migration 006 — Índices de desempenho
-- ============================================================


-- ============================================================
-- PROFILES
-- ============================================================

create index if not exists profiles_visibility_status_idx
  on public.profiles (
    visibility,
    status
  );


-- ============================================================
-- DISCOVERIES
-- ============================================================

create index if not exists discoveries_author_published_idx
  on public.discoveries (
    author_id,
    published_at desc
  );

create index if not exists discoveries_status_published_idx
  on public.discoveries (
    status,
    published_at desc
  );

create index if not exists discoveries_visibility_status_idx
  on public.discoveries (
    visibility,
    status
  );


-- ============================================================
-- PROFILE_INTERESTS
-- ============================================================

create index if not exists profile_interests_profile_weight_idx
  on public.profile_interests (
    profile_id,
    weight desc
  );

create index if not exists profile_interests_interest_profile_idx
  on public.profile_interests (
    interest_id,
    profile_id
  );


-- ============================================================
-- DISCOVERY_INTERESTS
-- ============================================================

create index if not exists discovery_interests_interest_discovery_idx
  on public.discovery_interests (
    interest_id,
    discovery_id
  );


-- ============================================================
-- FOLLOWS
-- ============================================================

create index if not exists follows_follower_created_idx
  on public.follows (
    follower_id,
    created_at desc
  );

create index if not exists follows_following_created_idx
  on public.follows (
    following_id,
    created_at desc
  );


-- ============================================================
-- REACTIONS
-- ============================================================

create index if not exists reactions_discovery_created_idx
  on public.reactions (
    discovery_id,
    created_at desc
  );

create index if not exists reactions_profile_created_idx
  on public.reactions (
    profile_id,
    created_at desc
  );


-- ============================================================
-- COMMENTS
-- ============================================================

create index if not exists comments_discovery_created_idx
  on public.comments (
    discovery_id,
    created_at
  );

create index if not exists comments_author_created_idx
  on public.comments (
    author_id,
    created_at desc
  );


-- ============================================================
-- SAVED DISCOVERIES
-- ============================================================

create index if not exists saved_discoveries_profile_created_idx
  on public.saved_discoveries (
    profile_id,
    created_at desc
  );


-- ============================================================
-- NOTIFICATIONS
-- ============================================================

create index if not exists notifications_recipient_read_created_idx
  on public.notifications (
    recipient_id,
    read_at,
    created_at desc
  );


-- ============================================================
-- BLOCKS
-- ============================================================

create index if not exists blocks_blocked_blocker_idx
  on public.blocks (
    blocked_id,
    blocker_id
  );


-- ============================================================
-- REPORTS
-- ============================================================

create index if not exists reports_status_created_idx
  on public.reports (
    status,
    created_at desc
  );