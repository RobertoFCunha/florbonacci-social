create or replace function public.can_comment_on_discovery(
  p_discovery_id uuid,
  p_actor_id uuid
)
returns boolean
language sql
stable
security definer
set search_path to 'public', 'pg_temp'
as $$
  select exists (
    select 1
    from public.discoveries d
    where d.id = p_discovery_id
      and (
        d.author_id = p_actor_id
        or (
          d.status = 'published'
          and d.visibility = 'public'
          and not public.has_block_between(
            p_actor_id,
            d.author_id
          )
        )
      )
  );
$$;

alter policy "comments_insert_own"
on public.comments
to authenticated
with check (
  author_id = auth.uid()
  and status = 'active'
  and public.can_comment_on_discovery(
    discovery_id,
    auth.uid()
  )
);