begin;

create or replace function public.notify_new_follower()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.follower_id = new.following_id then
    return new;
  end if;

  insert into public.notifications (
    recipient_id,
    actor_id,
    type
  )
  values (
    new.following_id,
    new.follower_id,
    'new_follower'
  );

  return new;
end;
$$;


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

  if v_author_id = new.profile_id then
    return new;
  end if;

  insert into public.notifications (
    recipient_id,
    actor_id,
    type,
    discovery_id
  )
  values (
    v_author_id,
    new.profile_id,
    'reaction',
    new.discovery_id
  );

  return new;
end;
$$;


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
  select d.author_id
  into v_discovery_author_id
  from public.discoveries d
  where d.id = new.discovery_id;

  if new.parent_comment_id is not null then
    select c.author_id
    into v_parent_author_id
    from public.comments c
    where c.id = new.parent_comment_id;
  end if;

  if
    new.parent_comment_id is not null
    and v_parent_author_id is not null
    and v_parent_author_id <> new.author_id
  then
    insert into public.notifications (
      recipient_id,
      actor_id,
      type,
      discovery_id,
      comment_id
    )
    values (
      v_parent_author_id,
      new.author_id,
      'comment_reply',
      new.discovery_id,
      new.id
    );
  end if;

  if
    v_discovery_author_id is not null
    and v_discovery_author_id <> new.author_id
    and (
      v_parent_author_id is null
      or v_discovery_author_id <> v_parent_author_id
    )
  then
    insert into public.notifications (
      recipient_id,
      actor_id,
      type,
      discovery_id,
      comment_id
    )
    values (
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

commit;