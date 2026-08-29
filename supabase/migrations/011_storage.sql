-- ============================================================
-- FLORBONACCI SOCIAL
-- Migration 011 — Storage privado e seguro
-- ============================================================
--
-- Buckets:
--   avatars
--   discovery-media
--   moderation-evidence
--
-- Convenções de caminho:
--
-- avatars:
--   avatars/{user_id}/{arquivo}
--
-- discovery-media:
--   discoveries/{user_id}/{discovery_id}/{arquivo}
--
-- moderation-evidence:
--   reports/{user_id}/{report_id}/{arquivo}
--
-- Todos os buckets permanecem PRIVADOS.
-- ============================================================


-- ============================================================
-- 1. BUCKET — AVATARS
-- ============================================================

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'avatars',
  'avatars',
  false,
  5242880,
  array[
    'image/jpeg',
    'image/png',
    'image/webp'
  ]
)
on conflict (id)
do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;


-- ============================================================
-- 2. BUCKET — DISCOVERY MEDIA
-- ============================================================

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'discovery-media',
  'discovery-media',
  false,
  15728640,
  array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/heic',
    'image/heif'
  ]
)
on conflict (id)
do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;


-- ============================================================
-- 3. BUCKET — MODERATION EVIDENCE
-- ============================================================

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'moderation-evidence',
  'moderation-evidence',
  false,
  10485760,
  array[
    'image/jpeg',
    'image/png',
    'image/webp'
  ]
)
on conflict (id)
do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;


-- ============================================================
-- 4. AVATARS — LEITURA
-- ============================================================
--
-- O usuário vê o próprio avatar.
--
-- Avatares de outras pessoas somente ficam acessíveis quando
-- o perfil correspondente estiver ativo, público e não houver
-- bloqueio entre as duas pessoas.
-- ============================================================

drop policy if exists "avatars_select_visible"
on storage.objects;

create policy "avatars_select_visible"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'avatars'
  and (
    (storage.foldername(name))[2] = auth.uid()::text

    or exists (
      select 1
      from public.profiles p
      where p.id::text = (storage.foldername(name))[2]
        and p.status = 'active'
        and p.visibility = 'public'
        and not public.has_block_between(
          auth.uid(),
          p.id
        )
    )
  )
);


-- ============================================================
-- 5. AVATARS — INSERT
-- ============================================================

drop policy if exists "avatars_insert_own"
on storage.objects;

create policy "avatars_insert_own"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = 'avatars'
  and (storage.foldername(name))[2] = auth.uid()::text
);


-- ============================================================
-- 6. AVATARS — UPDATE
-- ============================================================

drop policy if exists "avatars_update_own"
on storage.objects;

create policy "avatars_update_own"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[2] = auth.uid()::text
)
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = 'avatars'
  and (storage.foldername(name))[2] = auth.uid()::text
);


-- ============================================================
-- 7. AVATARS — DELETE
-- ============================================================

drop policy if exists "avatars_delete_own"
on storage.objects;

create policy "avatars_delete_own"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[2] = auth.uid()::text
);


-- ============================================================
-- 8. DISCOVERY MEDIA — LEITURA
-- ============================================================
--
-- Caminho:
-- discoveries/{user_id}/{discovery_id}/{arquivo}
--
-- Autor sempre pode acessar sua própria mídia.
--
-- Outra pessoa somente vê a mídia quando a descoberta:
--   - estiver publicada;
--   - for pública;
--   - não houver bloqueio entre visitante e autor.
-- ============================================================

drop policy if exists "discovery_media_storage_select_visible"
on storage.objects;

create policy "discovery_media_storage_select_visible"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'discovery-media'
  and exists (
    select 1
    from public.discoveries d
    where d.id::text = (storage.foldername(name))[3]
      and d.author_id::text = (storage.foldername(name))[2]
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
-- 9. DISCOVERY MEDIA — INSERT
-- ============================================================

drop policy if exists "discovery_media_storage_insert_own"
on storage.objects;

create policy "discovery_media_storage_insert_own"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'discovery-media'
  and (storage.foldername(name))[1] = 'discoveries'
  and (storage.foldername(name))[2] = auth.uid()::text
  and exists (
    select 1
    from public.discoveries d
    where d.id::text = (storage.foldername(name))[3]
      and d.author_id = auth.uid()
  )
);


-- ============================================================
-- 10. DISCOVERY MEDIA — UPDATE
-- ============================================================

drop policy if exists "discovery_media_storage_update_own"
on storage.objects;

create policy "discovery_media_storage_update_own"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'discovery-media'
  and (storage.foldername(name))[2] = auth.uid()::text
  and exists (
    select 1
    from public.discoveries d
    where d.id::text = (storage.foldername(name))[3]
      and d.author_id = auth.uid()
  )
)
with check (
  bucket_id = 'discovery-media'
  and (storage.foldername(name))[1] = 'discoveries'
  and (storage.foldername(name))[2] = auth.uid()::text
  and exists (
    select 1
    from public.discoveries d
    where d.id::text = (storage.foldername(name))[3]
      and d.author_id = auth.uid()
  )
);


-- ============================================================
-- 11. DISCOVERY MEDIA — DELETE
-- ============================================================

drop policy if exists "discovery_media_storage_delete_own"
on storage.objects;

create policy "discovery_media_storage_delete_own"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'discovery-media'
  and (storage.foldername(name))[2] = auth.uid()::text
  and exists (
    select 1
    from public.discoveries d
    where d.id::text = (storage.foldername(name))[3]
      and d.author_id = auth.uid()
  )
);


-- ============================================================
-- 12. MODERATION EVIDENCE — LEITURA
-- ============================================================
--
-- Evidências não são públicas.
-- O usuário acessa somente evidências que ele próprio enviou.
--
-- Moderadores/backend poderão acessá-las via service_role,
-- que não depende dessas policies de cliente.
-- ============================================================

drop policy if exists "moderation_evidence_select_own"
on storage.objects;

create policy "moderation_evidence_select_own"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'moderation-evidence'
  and (storage.foldername(name))[2] = auth.uid()::text
);


-- ============================================================
-- 13. MODERATION EVIDENCE — INSERT
-- ============================================================

drop policy if exists "moderation_evidence_insert_own"
on storage.objects;

create policy "moderation_evidence_insert_own"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'moderation-evidence'
  and (storage.foldername(name))[1] = 'reports'
  and (storage.foldername(name))[2] = auth.uid()::text
  and exists (
    select 1
    from public.reports r
    where r.id::text = (storage.foldername(name))[3]
      and r.reporter_id = auth.uid()
  )
);


-- ============================================================
-- 14. MODERATION EVIDENCE — DELETE
-- ============================================================
--
-- Enquanto a denúncia pertence ao usuário, ele pode retirar
-- uma evidência enviada por ele.
-- ============================================================

drop policy if exists "moderation_evidence_delete_own"
on storage.objects;

create policy "moderation_evidence_delete_own"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'moderation-evidence'
  and (storage.foldername(name))[2] = auth.uid()::text
  and exists (
    select 1
    from public.reports r
    where r.id::text = (storage.foldername(name))[3]
      and r.reporter_id = auth.uid()
  )
);


-- ============================================================
-- FIM DA MIGRATION 011
-- ============================================================