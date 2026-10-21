-- Noon: database schema for Supabase (Postgres).
-- Run once in the Supabase SQL editor, or apply as a migration.
-- Everything the app keeps in the browser today has a home here:
-- profiles (you), teams, members (people in a team), events + attendees,
-- threads + comments + reactions. Row Level Security keeps each team private.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------- people

-- One row per signed-in user. Your own schedule lives here and follows you into every team.
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  name        text not null default '',
  email       text,
  photo       text,
  tz          text not null default 'UTC',
  start_h     numeric(4,2) not null default 9,     -- online from (hours, 13.5 = 13:30)
  end_h       numeric(4,2) not null default 17,    -- online until
  start2_h    numeric(4,2),                        -- optional second online block
  end2_h      numeric(4,2),
  weekends    boolean not null default false,
  sleep_start numeric(4,2) not null default 23,
  sleep_end   numeric(4,2) not null default 7,
  cal         boolean not null default false,      -- a calendar is connected
  conn        text[] not null default '{}',        -- connected tools, e.g. {google,slack}
  created_at  timestamptz not null default now()
);

create table public.teams (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  created_by  uuid not null references auth.users(id),
  invite_code text not null unique default encode(gen_random_bytes(8), 'hex'),
  created_at  timestamptz not null default now()
);

-- A seat in a team. Linked to a user once they have joined; until then a placeholder
-- you manage (someone you added by name, or someone you invited by email).
create table public.members (
  id           uuid primary key default gen_random_uuid(),
  team_id      uuid not null references public.teams(id) on delete cascade,
  user_id      uuid references auth.users(id) on delete set null,
  added_by     uuid references auth.users(id),
  invite_email text,
  status       text not null default 'active' check (status in ('active', 'invited')),
  -- schedule for placeholders; for people who joined, the profile wins (see v_members)
  name         text not null default '',
  photo        text,
  tz           text,
  start_h      numeric(4,2) default 9,
  end_h        numeric(4,2) default 17,
  start2_h     numeric(4,2),
  end2_h       numeric(4,2),
  weekends     boolean default false,
  sleep_start  numeric(4,2) default 23,
  sleep_end    numeric(4,2) default 7,
  created_at   timestamptz not null default now(),
  unique (team_id, user_id)
);
create index members_team_idx on public.members(team_id);
create index members_user_idx on public.members(user_id);

-- What the app reads: one shape per person, profile values winning for people who joined.
create view public.v_members with (security_invoker = true) as
select m.id, m.team_id, m.user_id, m.added_by, m.invite_email, m.status, m.created_at,
  coalesce(p.name, m.name)               as name,
  coalesce(p.email, m.invite_email)      as email,
  coalesce(p.photo, m.photo)             as photo,
  coalesce(p.tz, m.tz)                   as tz,
  coalesce(p.start_h, m.start_h)         as start_h,
  coalesce(p.end_h, m.end_h)             as end_h,
  coalesce(p.start2_h, m.start2_h)       as start2_h,
  coalesce(p.end2_h, m.end2_h)           as end2_h,
  coalesce(p.weekends, m.weekends)       as weekends,
  coalesce(p.sleep_start, m.sleep_start) as sleep_start,
  coalesce(p.sleep_end, m.sleep_end)     as sleep_end,
  coalesce(p.cal, false)                 as cal,
  coalesce(p.conn, '{}')                 as conn,
  (m.user_id is not null)                as joined
from public.members m
left join public.profiles p on p.id = m.user_id;

-- ---------------------------------------------------------------- time

create table public.events (
  id         uuid primary key default gen_random_uuid(),
  team_id    uuid not null references public.teams(id) on delete cascade,
  title      text not null default 'Meeting',
  starts_at  timestamptz not null,
  ends_at    timestamptz not null,
  created_by uuid references public.members(id) on delete set null,
  created_at timestamptz not null default now(),
  check (ends_at > starts_at)
);
create index events_team_time_idx on public.events(team_id, starts_at);

-- Who is in a meeting, and where they stand on it. 'requested' = asked to join.
create table public.attendees (
  event_id     uuid not null references public.events(id) on delete cascade,
  member_id    uuid not null references public.members(id) on delete cascade,
  status       text not null default 'pending' check (status in ('pending', 'accepted', 'declined', 'requested')),
  invited_by   uuid references public.members(id) on delete set null,
  move_request text,                               -- "30 min later": this attendee asked to move it
  primary key (event_id, member_id)
);

-- A thread sits on a stretch of someone's time, or on a meeting.
create table public.threads (
  id         uuid primary key default gen_random_uuid(),
  team_id    uuid not null references public.teams(id) on delete cascade,
  member_id  uuid references public.members(id) on delete cascade,   -- whose time
  event_id   uuid references public.events(id) on delete cascade,    -- or which meeting
  starts_at  timestamptz,
  ends_at    timestamptz,
  created_by uuid references public.members(id) on delete set null,
  created_at timestamptz not null default now(),
  check ((member_id is not null and starts_at is not null and ends_at is not null) or event_id is not null)
);
create unique index threads_event_uq on public.threads(event_id) where event_id is not null;
create index threads_team_idx on public.threads(team_id);

create table public.comments (
  id         uuid primary key default gen_random_uuid(),
  thread_id  uuid not null references public.threads(id) on delete cascade,
  author_id  uuid references public.members(id) on delete set null,
  body       text not null check (length(body) <= 500),
  created_at timestamptz not null default now()
);
create index comments_thread_idx on public.comments(thread_id, created_at);

-- A reaction on a thread or on a single comment, one per person per emoji.
create table public.reactions (
  id         uuid primary key default gen_random_uuid(),
  thread_id  uuid references public.threads(id) on delete cascade,
  comment_id uuid references public.comments(id) on delete cascade,
  member_id  uuid not null references public.members(id) on delete cascade,
  emoji      text not null,
  check ((thread_id is null) <> (comment_id is null))
);
create unique index reactions_uq on public.reactions(coalesce(thread_id, comment_id), member_id, emoji);

-- ---------------------------------------------------------------- helpers

-- Am I in this team? (security definer so policies can ask without recursing into members' own policies)
create or replace function public.is_member(t uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.members where team_id = t and user_id = auth.uid());
$$;

create or replace function public.my_member_id(t uuid) returns uuid
language sql stable security definer set search_path = public as $$
  select id from public.members where team_id = t and user_id = auth.uid() limit 1;
$$;

-- New sign-up: make a profile, and claim any invite waiting under that email.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, name, email, photo)
  values (new.id,
          coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
          new.email,
          new.raw_user_meta_data->>'avatar_url')
  on conflict (id) do nothing;
  update public.members set user_id = new.id, status = 'active'
  where user_id is null and lower(invite_email) = lower(new.email);
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();

-- Create a team and take the first seat in it.
create or replace function public.create_team(team_name text) returns uuid
language plpgsql security definer set search_path = public as $$
declare t uuid;
begin
  if auth.uid() is null then raise exception 'Sign in first'; end if;
  insert into public.teams (name, created_by) values (team_name, auth.uid()) returning id into t;
  insert into public.members (team_id, user_id, added_by, status) values (t, auth.uid(), auth.uid(), 'active');
  return t;
end $$;

-- Join a team from an invite link.
create or replace function public.join_team(code text) returns uuid
language plpgsql security definer set search_path = public as $$
declare t uuid;
begin
  if auth.uid() is null then raise exception 'Sign in first'; end if;
  select id into t from public.teams where invite_code = code;
  if t is null then raise exception 'That invite link is not valid'; end if;
  insert into public.members (team_id, user_id, added_by, status) values (t, auth.uid(), auth.uid(), 'active')
  on conflict (team_id, user_id) do update set status = 'active';
  return t;
end $$;

-- ---------------------------------------------------------------- row level security

alter table public.profiles  enable row level security;
alter table public.teams     enable row level security;
alter table public.members   enable row level security;
alter table public.events    enable row level security;
alter table public.attendees enable row level security;
alter table public.threads   enable row level security;
alter table public.comments  enable row level security;
alter table public.reactions enable row level security;

-- profiles: yours to edit; readable by anyone who shares a team with you
create policy "profiles: read teammates" on public.profiles for select using (
  id = auth.uid() or exists (
    select 1 from public.members a join public.members b on a.team_id = b.team_id
    where a.user_id = auth.uid() and b.user_id = profiles.id));
create policy "profiles: insert own" on public.profiles for insert with check (id = auth.uid());
create policy "profiles: edit own"   on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());

-- teams: members read; the creator renames or deletes (creation goes through create_team)
create policy "teams: members read"    on public.teams for select using (public.is_member(id));
create policy "teams: creator edits"   on public.teams for update using (created_by = auth.uid());
create policy "teams: creator deletes" on public.teams for delete using (created_by = auth.uid());

-- members: teammates read; you add placeholders and invites; you edit your own seat or the placeholders you added;
-- you remove yourself, the people you added, or anyone if you created the team
create policy "members: teammates read" on public.members for select using (public.is_member(team_id));
create policy "members: add people"     on public.members for insert with check (public.is_member(team_id) and added_by = auth.uid() and user_id is null);
create policy "members: edit own or added" on public.members for update using (user_id = auth.uid() or (user_id is null and added_by = auth.uid()));
create policy "members: remove" on public.members for delete using (
  user_id = auth.uid() or added_by = auth.uid()
  or exists (select 1 from public.teams t where t.id = team_id and t.created_by = auth.uid()));

-- events: teammates read and add; the person who booked it edits or removes it
create policy "events: teammates"      on public.events for select using (public.is_member(team_id));
create policy "events: add"            on public.events for insert with check (public.is_member(team_id));
create policy "events: author edits"   on public.events for update using (created_by = public.my_member_id(team_id));
create policy "events: author removes" on public.events for delete using (created_by = public.my_member_id(team_id));

-- attendees: teammates read and invite; you answer for your own seat; the booker can answer for placeholders
create policy "attendees: teammates" on public.attendees for select using (
  exists (select 1 from public.events e where e.id = event_id and public.is_member(e.team_id)));
create policy "attendees: add" on public.attendees for insert with check (
  exists (select 1 from public.events e where e.id = event_id and public.is_member(e.team_id)));
create policy "attendees: answer" on public.attendees for update using (
  exists (select 1 from public.members m where m.id = member_id and m.user_id = auth.uid())
  or exists (select 1 from public.events e where e.id = event_id and e.created_by = public.my_member_id(e.team_id)));
create policy "attendees: remove" on public.attendees for delete using (
  exists (select 1 from public.members m where m.id = member_id and m.user_id = auth.uid())
  or exists (select 1 from public.events e where e.id = event_id and e.created_by = public.my_member_id(e.team_id)));

-- threads, comments, reactions: teammates read and add; you remove your own
create policy "threads: teammates" on public.threads for select using (public.is_member(team_id));
create policy "threads: add"       on public.threads for insert with check (public.is_member(team_id));
create policy "threads: remove own" on public.threads for delete using (created_by = public.my_member_id(team_id));

create policy "comments: teammates" on public.comments for select using (
  exists (select 1 from public.threads t where t.id = thread_id and public.is_member(t.team_id)));
create policy "comments: add own" on public.comments for insert with check (
  exists (select 1 from public.threads t join public.members m on m.id = author_id and m.team_id = t.team_id
          where t.id = thread_id and m.user_id = auth.uid()));
create policy "comments: remove own" on public.comments for delete using (
  exists (select 1 from public.members m where m.id = author_id and m.user_id = auth.uid()));

create policy "reactions: teammates" on public.reactions for select using (
  exists (select 1 from public.members m where m.id = member_id and public.is_member(m.team_id)));
create policy "reactions: add own" on public.reactions for insert with check (
  exists (select 1 from public.members m where m.id = member_id and m.user_id = auth.uid()));
create policy "reactions: remove own" on public.reactions for delete using (
  exists (select 1 from public.members m where m.id = member_id and m.user_id = auth.uid()));

-- ---------------------------------------------------------------- live updates

alter publication supabase_realtime add table
  public.members, public.events, public.attendees, public.threads, public.comments, public.reactions,
  public.profiles, public.teams;

-- ---------------------------------------------------------------- account settings

alter table public.profiles
  add column if not exists notify jsonb not null default '{"invites":true,"mentions":true,"replies":true,"missed":true,"weekly":false}',
  add column if not exists prefs  jsonb not null default '{}';

-- profile photos: a public bucket, each person writes only inside their own folder
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 2097152, array['image/png','image/jpeg','image/webp','image/gif'])
on conflict (id) do nothing;
create policy "avatars: read own" on storage.objects for select to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "avatars: upload own" on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "avatars: replace own" on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "avatars: remove own" on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

-- delete my account: teams I created pass to a teammate, or go if nobody else is in them
create or replace function public.delete_account() returns void
language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); t record; heir uuid;
begin
  if me is null then raise exception 'Sign in first'; end if;
  for t in select id from public.teams where created_by = me loop
    select user_id into heir from public.members where team_id = t.id and user_id is not null and user_id <> me order by created_at limit 1;
    if heir is null then delete from public.teams where id = t.id;
    else update public.teams set created_by = heir where id = t.id; end if;
  end loop;
  update public.members set added_by = null where added_by = me;
  delete from auth.users where id = me;
end $$;
revoke execute on function public.delete_account() from public, anon;
grant execute on function public.delete_account() to authenticated;

-- ---------------------------------------------------------------- tasks

-- for anyone on the team, with an optional deadline, kept until done or deleted
create table public.tasks (
  id         uuid primary key default gen_random_uuid(),
  team_id    uuid not null references public.teams(id) on delete cascade,
  title      text not null check (length(title) <= 120),
  note       text,
  due_day    date,                 -- "by the end of this day"
  due_time   text,                 -- optional "HH:MM" on that day, read in due_tz
  due_tz     text,
  done_at    timestamptz,
  cleared    boolean not null default false,   -- finished and cleared from the open list
  created_by uuid references public.members(id) on delete set null,
  created_at timestamptz not null default now()
);
create index tasks_team_idx on public.tasks(team_id);

create table public.task_assignees (
  task_id   uuid not null references public.tasks(id) on delete cascade,
  member_id uuid not null references public.members(id) on delete cascade,
  primary key (task_id, member_id)
);

alter table public.tasks enable row level security;
alter table public.task_assignees enable row level security;

-- teammates see and add tasks; the person who made one, or anyone it is assigned to, changes or removes it
create policy "tasks: teammates" on public.tasks for select using (public.is_member(team_id));
create policy "tasks: add"       on public.tasks for insert with check (public.is_member(team_id));
create policy "tasks: edit" on public.tasks for update using (
  created_by = public.my_member_id(team_id)
  or exists (select 1 from public.task_assignees ta join public.members m on m.id = ta.member_id where ta.task_id = tasks.id and m.user_id = auth.uid()));
create policy "tasks: remove" on public.tasks for delete using (
  created_by = public.my_member_id(team_id)
  or exists (select 1 from public.task_assignees ta join public.members m on m.id = ta.member_id where ta.task_id = tasks.id and m.user_id = auth.uid()));

create policy "task_assignees: teammates" on public.task_assignees for select using (
  exists (select 1 from public.tasks t where t.id = task_id and public.is_member(t.team_id)));
create policy "task_assignees: add" on public.task_assignees for insert with check (
  exists (select 1 from public.tasks t where t.id = task_id and public.is_member(t.team_id)));
create policy "task_assignees: remove" on public.task_assignees for delete using (
  exists (select 1 from public.tasks t where t.id = task_id and public.is_member(t.team_id)));

alter publication supabase_realtime add table public.tasks, public.task_assignees;

-- a thread can hang off a task, the same way it hangs off a block of time or a meeting
alter table public.threads add column if not exists task_id uuid references public.tasks(id) on delete cascade;
alter table public.threads drop constraint if exists threads_check;
alter table public.threads add constraint threads_target check (
  (member_id is not null and starts_at is not null and ends_at is not null) or event_id is not null or task_id is not null);
create unique index if not exists threads_task_uq on public.threads(task_id) where task_id is not null;

-- ---------------------------------------------------------------- who may call what

-- The trigger needs no callers at all; the two RPCs are for signed-in users only.
-- The membership checks stay callable by anyone: policies run them, and with no session they only ever say "no".
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.create_team(text) from public, anon;
revoke execute on function public.join_team(text) from public, anon;
