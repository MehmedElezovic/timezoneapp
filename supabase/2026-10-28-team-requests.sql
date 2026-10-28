-- Noon: an invite is a request, not a seat. Opening a team's invite link (or signing up through one, or under an
-- email a teammate added) leaves a request on your account; you are in the team only once you accept it. A new
-- account starts in no team at all. Pasting a link in Settings › Teams still joins straight away (join_team).
-- Safe to run more than once.

create table if not exists public.team_invites (
  id          uuid primary key default gen_random_uuid(),
  team_id     uuid not null references public.teams(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  invited_by  uuid references auth.users(id) on delete set null,
  member_id   uuid references public.members(id) on delete set null,  -- the seat a teammate made for this email, if any
  via         text not null default 'link' check (via in ('link', 'email')),
  created_at  timestamptz not null default now(),
  unique (team_id, user_id)
);
alter table public.team_invites enable row level security;
drop policy if exists "team_invites: read own" on public.team_invites;
create policy "team_invites: read own" on public.team_invites for select using (user_id = auth.uid());

-- New sign-up: make a profile; a seat waiting under that email, or the link they signed up through, becomes a request
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare t public.teams;
begin
  insert into public.profiles (id, name, email, photo)
  values (new.id,
          coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
          new.email,
          new.raw_user_meta_data->>'avatar_url')
  on conflict (id) do nothing;
  insert into public.team_invites (team_id, user_id, invited_by, member_id, via)
  select m.team_id, new.id, m.added_by, m.id, 'email' from public.members m
  where m.user_id is null and lower(m.invite_email) = lower(new.email)
  on conflict (team_id, user_id) do nothing;
  select * into t from public.teams where invite_code = new.raw_user_meta_data->>'invite';
  if t.id is not null then
    insert into public.team_invites (team_id, user_id, invited_by, via) values (t.id, new.id, t.created_by, 'link')
    on conflict (team_id, user_id) do nothing;
  end if;
  return new;
end $$;

-- the team behind an invite code, before signing in: its name and how many are in it, nothing else
create or replace function public.invite_peek(code text) returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object('name', t.name, 'people', (select count(*) from public.members m where m.team_id = t.id and m.user_id is not null))
  from public.teams t where code ~ '^[A-Za-z0-9]{6,64}$' and t.invite_code = code;
$$;

-- opening an invite link while signed in: leave a request on your account (or say you are already in)
create or replace function public.invite_hold(code text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare t public.teams; i uuid;
begin
  if auth.uid() is null then raise exception 'Sign in first'; end if;
  select * into t from public.teams where invite_code = code;
  if t.id is null then raise exception 'That invite link is not valid'; end if;
  if public.is_member(t.id) then return jsonb_build_object('team_id', t.id, 'name', t.name, 'member', true); end if;
  insert into public.team_invites (team_id, user_id, invited_by, via) values (t.id, auth.uid(), t.created_by, 'link')
  on conflict (team_id, user_id) do update set created_at = public.team_invites.created_at returning id into i;
  return jsonb_build_object('id', i, 'team_id', t.id, 'name', t.name, 'member', false);
end $$;

-- your open requests, with what you need to decide: the team, who asked, how many are in it
create or replace function public.my_invites() returns jsonb
language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object('id', i.id, 'team_id', t.id, 'name', t.name, 'via', i.via, 'created_at', i.created_at,
    'by', (select p.name from public.profiles p where p.id = i.invited_by),
    'photo', (select p.photo from public.profiles p where p.id = i.invited_by),
    'people', (select count(*) from public.members m where m.team_id = t.id and m.user_id is not null)) order by i.created_at), '[]'::jsonb)
  from public.team_invites i join public.teams t on t.id = i.team_id
  where i.user_id = auth.uid() and not public.is_member(t.id);
$$;

-- yes takes the seat (the one made for your email, if it is still free), no just clears the request
create or replace function public.invite_answer(p_id uuid, p_accept boolean) returns uuid
language plpgsql security definer set search_path = public as $$
declare i public.team_invites;
begin
  if auth.uid() is null then raise exception 'Sign in first'; end if;
  select * into i from public.team_invites where id = p_id and user_id = auth.uid();
  if i.id is null then raise exception 'That invite is no longer open'; end if;
  delete from public.team_invites where id = i.id;
  if not p_accept then return null; end if;
  if not public.is_member(i.team_id) then
    update public.members set user_id = auth.uid(), status = 'active'
    where id = i.member_id and user_id is null and team_id = i.team_id;
    if not found then
      insert into public.members (team_id, user_id, added_by, status) values (i.team_id, auth.uid(), coalesce(i.invited_by, auth.uid()), 'active')
      on conflict (team_id, user_id) do update set status = 'active';
    end if;
  end if;
  return i.team_id;
end $$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.invite_peek(text) from public;
revoke execute on function public.invite_hold(text) from public, anon;
revoke execute on function public.my_invites() from public, anon;
revoke execute on function public.invite_answer(uuid, boolean) from public, anon;
grant execute on function public.invite_peek(text) to anon, authenticated;
grant execute on function public.invite_hold(text) to authenticated;
grant execute on function public.my_invites() to authenticated;
grant execute on function public.invite_answer(uuid, boolean) to authenticated;
