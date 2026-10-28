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

-- ---------------------------------------------------------------- files on tasks
-- the list lives on the task, the bytes in a private bucket only teammates can read; path <team_id>/<task_id>/<file>
alter table public.tasks add column if not exists files jsonb not null default '[]'::jsonb;
insert into storage.buckets (id, name, public, file_size_limit) values ('task-files', 'task-files', false, 10485760) on conflict (id) do nothing;
create policy "task-files: teammates read" on storage.objects for select to authenticated
  using (bucket_id = 'task-files' and public.is_member(((storage.foldername(name))[1])::uuid));
create policy "task-files: teammates upload" on storage.objects for insert to authenticated
  with check (bucket_id = 'task-files' and public.is_member(((storage.foldername(name))[1])::uuid));
create policy "task-files: teammates remove" on storage.objects for delete to authenticated
  using (bucket_id = 'task-files' and public.is_member(((storage.foldername(name))[1])::uuid));

-- ---------------------------------------------------------------- 2026-10-27: place and kind on a meeting
alter table public.events add column if not exists location text;
alter table public.events add column if not exists kind text check (kind is null or kind in ('meet','plan','review'));

-- ---------------------------------------------------------------- 2026-10-27: projects, versions and the comments on them

create table if not exists public.projects (
  id         uuid primary key,
  team_id    uuid not null references public.teams(id) on delete cascade,
  name       text not null check (length(name) <= 60),
  due_day    date,
  created_by uuid references public.members(id) on delete set null,
  changed_by uuid references public.members(id) on delete set null,
  changed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index if not exists projects_team_idx on public.projects(team_id);

create table if not exists public.project_assignees (
  project_id uuid not null references public.projects(id) on delete cascade,
  member_id  uuid not null references public.members(id) on delete cascade,
  primary key (project_id, member_id)
);

create table if not exists public.versions (
  id         uuid primary key,
  project_id uuid not null references public.projects(id) on delete cascade,
  team_id    uuid not null references public.teams(id) on delete cascade,
  n          integer not null,
  name       text not null,
  path       text not null,
  size       integer,
  file       text,                                  -- storage path of the page in project-files
  assets     jsonb not null default '[]'::jsonb,    -- [{id, path, size, type, file}]
  created_by uuid references public.members(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists versions_project_idx on public.versions(project_id, n);
create index if not exists versions_team_idx on public.versions(team_id);

create table if not exists public.version_comments (
  id           uuid primary key,
  version_id   uuid not null references public.versions(id) on delete cascade,
  team_id      uuid not null references public.teams(id) on delete cascade,
  n            integer not null,
  sel          text,                                -- css path to the element the pin sits on
  rx           real, ry real,                       -- where on that element, 0..1
  px           real, py real,                       -- page coordinates, the fallback
  dev          text,                                -- width it was left at: desktop, tablet, phone
  body         text not null check (length(body) <= 1000),
  author_id    uuid references public.members(id) on delete set null,
  status       text not null default 'open' check (status in ('open', 'resolved')),
  from_version text,                                -- "v1" when carried over from an earlier version
  from_comment uuid,
  created_at   timestamptz not null default now()
);
create index if not exists version_comments_version_idx on public.version_comments(version_id);
create index if not exists version_comments_team_idx on public.version_comments(team_id);

create table if not exists public.version_replies (
  id         uuid primary key,
  comment_id uuid not null references public.version_comments(id) on delete cascade,
  team_id    uuid not null references public.teams(id) on delete cascade,
  author_id  uuid references public.members(id) on delete set null,
  body       text not null check (length(body) <= 1000),
  created_at timestamptz not null default now()
);
create index if not exists version_replies_comment_idx on public.version_replies(comment_id);
create index if not exists version_replies_team_idx on public.version_replies(team_id);

alter table public.projects          enable row level security;
alter table public.project_assignees enable row level security;
alter table public.versions          enable row level security;
alter table public.version_comments  enable row level security;
alter table public.version_replies   enable row level security;

-- teammates see everything in the project, add to it, and change what is shared (name, deadline, who is on it, a comment's status);
-- you remove what you wrote, or a whole project or version if you are on the team
drop policy if exists "projects: teammates" on public.projects;
drop policy if exists "projects: add"       on public.projects;
drop policy if exists "projects: edit"      on public.projects;
drop policy if exists "projects: remove"    on public.projects;
create policy "projects: teammates" on public.projects for select using (public.is_member(team_id));
create policy "projects: add"       on public.projects for insert with check (public.is_member(team_id));
create policy "projects: edit"      on public.projects for update using (public.is_member(team_id)) with check (public.is_member(team_id));
create policy "projects: remove"    on public.projects for delete using (public.is_member(team_id));

drop policy if exists "project_assignees: teammates" on public.project_assignees;
drop policy if exists "project_assignees: add"       on public.project_assignees;
drop policy if exists "project_assignees: remove"    on public.project_assignees;
create policy "project_assignees: teammates" on public.project_assignees for select using (
  exists (select 1 from public.projects p where p.id = project_id and public.is_member(p.team_id)));
create policy "project_assignees: add" on public.project_assignees for insert with check (
  exists (select 1 from public.projects p where p.id = project_id and public.is_member(p.team_id)));
create policy "project_assignees: remove" on public.project_assignees for delete using (
  exists (select 1 from public.projects p where p.id = project_id and public.is_member(p.team_id)));

drop policy if exists "versions: teammates" on public.versions;
drop policy if exists "versions: add"       on public.versions;
drop policy if exists "versions: edit"      on public.versions;
drop policy if exists "versions: remove"    on public.versions;
create policy "versions: teammates" on public.versions for select using (public.is_member(team_id));
create policy "versions: add"       on public.versions for insert with check (public.is_member(team_id));
create policy "versions: edit"      on public.versions for update using (public.is_member(team_id)) with check (public.is_member(team_id));
create policy "versions: remove"    on public.versions for delete using (public.is_member(team_id));

drop policy if exists "version_comments: teammates"  on public.version_comments;
drop policy if exists "version_comments: add own"    on public.version_comments;
drop policy if exists "version_comments: edit"       on public.version_comments;
drop policy if exists "version_comments: remove own" on public.version_comments;
create policy "version_comments: teammates" on public.version_comments for select using (public.is_member(team_id));
create policy "version_comments: add own"   on public.version_comments for insert with check (
  public.is_member(team_id) and (author_id is null or author_id = public.my_member_id(team_id)
    or from_comment is not null));                   -- carried-over comments keep their original author
create policy "version_comments: edit"      on public.version_comments for update using (public.is_member(team_id)) with check (public.is_member(team_id));
create policy "version_comments: remove own" on public.version_comments for delete using (
  author_id = public.my_member_id(team_id) or author_id is null);

drop policy if exists "version_replies: teammates"  on public.version_replies;
drop policy if exists "version_replies: add own"    on public.version_replies;
drop policy if exists "version_replies: remove own" on public.version_replies;
create policy "version_replies: teammates"  on public.version_replies for select using (public.is_member(team_id));
create policy "version_replies: add own"    on public.version_replies for insert with check (
  public.is_member(team_id) and (author_id is null or author_id = public.my_member_id(team_id)));
create policy "version_replies: remove own" on public.version_replies for delete using (
  author_id = public.my_member_id(team_id) or author_id is null);

-- the files: a private bucket only teammates can read; path <team_id>/<project_id>/<version_id>/<file path>
insert into storage.buckets (id, name, public, file_size_limit) values ('project-files', 'project-files', false, 26214400) on conflict (id) do nothing;
drop policy if exists "project-files: teammates read"   on storage.objects;
drop policy if exists "project-files: teammates upload" on storage.objects;
drop policy if exists "project-files: teammates replace" on storage.objects;
drop policy if exists "project-files: teammates remove" on storage.objects;
create policy "project-files: teammates read" on storage.objects for select to authenticated
  using (bucket_id = 'project-files' and public.is_member(((storage.foldername(name))[1])::uuid));
create policy "project-files: teammates upload" on storage.objects for insert to authenticated
  with check (bucket_id = 'project-files' and public.is_member(((storage.foldername(name))[1])::uuid));
create policy "project-files: teammates replace" on storage.objects for update to authenticated
  using (bucket_id = 'project-files' and public.is_member(((storage.foldername(name))[1])::uuid));
create policy "project-files: teammates remove" on storage.objects for delete to authenticated
  using (bucket_id = 'project-files' and public.is_member(((storage.foldername(name))[1])::uuid));

-- live updates
do $$ begin
  alter publication supabase_realtime add table public.projects, public.project_assignees, public.versions, public.version_comments, public.version_replies;
exception when duplicate_object then null; end $$;

-- ================================================================ 2026-10-27: client links and the Claude connector
-- (also in supabase/2026-10-27-share-and-connector.sql; applied as migration noon_share_and_connector)

-- ---------------------------------------------------------------- client links
alter table public.projects add column if not exists share_on boolean not null default false;
alter table public.projects add column if not exists share_token text;
alter table public.projects add column if not exists changed_guest text;           -- a client's name when they made the last change
create unique index if not exists projects_share_token_idx on public.projects(share_token) where share_token is not null;
alter table public.projects drop constraint if exists projects_share_token_check;
alter table public.projects add constraint projects_share_token_check check (share_token is null or share_token ~ '^[A-Za-z0-9_-]{20,64}$');

alter table public.version_comments add column if not exists guest_name text;      -- set when a client left it
alter table public.version_comments add column if not exists guest_key  text;      -- sha-256 of the guest's browser key, so they can delete their own
alter table public.version_comments add column if not exists snippet    text;      -- the element the pin sits on, as it was then
alter table public.version_comments drop constraint if exists version_comments_guest_check;
alter table public.version_comments add constraint version_comments_guest_check check ((guest_name is null or length(guest_name) <= 60) and (snippet is null or length(snippet) <= 2000));
alter table public.version_replies add column if not exists guest_name text;
alter table public.version_replies add column if not exists guest_key  text;
alter table public.version_replies drop constraint if exists version_replies_guest_check;
alter table public.version_replies add constraint version_replies_guest_check check (guest_name is null or length(guest_name) <= 60);

-- the project behind a live link, or nothing
create or replace function public.shared_project(p_token text) returns public.projects
language sql stable security definer set search_path = public as $$
  select * from public.projects where p_token ~ '^[A-Za-z0-9_-]{20,64}$' and share_token = p_token and share_on limit 1;
$$;

create or replace function public.guest_hash(p_key text) returns text
language sql immutable set search_path = public as $$
  select case when p_key is null or length(p_key) < 16 or length(p_key) > 128 then null else encode(sha256(convert_to(p_key, 'UTF8')), 'hex') end;
$$;

-- everything a client sees: the project, its versions, the comments and replies, and the names of the people who wrote them
create or replace function public.share_open(p_token text, p_key text default null) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare p public.projects; k text := public.guest_hash(p_key);
begin
  select * into p from public.shared_project(p_token);
  if p.id is null then return null; end if;
  return jsonb_build_object(
    'project', jsonb_build_object('id', p.id, 'team_id', p.team_id, 'name', p.name, 'changed_at', p.changed_at,
                                  'team', (select t.name from public.teams t where t.id = p.team_id)),
    'versions', coalesce((select jsonb_agg(jsonb_build_object('id', v.id, 'n', v.n, 'name', v.name, 'path', v.path, 'size', v.size,
                  'file', v.file, 'assets', v.assets, 'created_at', v.created_at) order by v.n)
                from public.versions v where v.project_id = p.id), '[]'::jsonb),
    'comments', coalesce((select jsonb_agg(jsonb_build_object('id', c.id, 'version_id', c.version_id, 'n', c.n, 'sel', c.sel, 'rx', c.rx, 'ry', c.ry,
                  'px', c.px, 'py', c.py, 'dev', c.dev, 'body', c.body, 'author_id', c.author_id, 'guest_name', c.guest_name,
                  'status', c.status, 'from_version', c.from_version, 'created_at', c.created_at,
                  'mine', (k is not null and c.guest_key = k)) order by c.n)
                from public.version_comments c join public.versions v on v.id = c.version_id where v.project_id = p.id), '[]'::jsonb),
    'replies', coalesce((select jsonb_agg(jsonb_build_object('id', r.id, 'comment_id', r.comment_id, 'body', r.body, 'author_id', r.author_id,
                  'guest_name', r.guest_name, 'created_at', r.created_at, 'mine', (k is not null and r.guest_key = k)) order by r.created_at)
                from public.version_replies r join public.version_comments c on c.id = r.comment_id join public.versions v on v.id = c.version_id
                where v.project_id = p.id), '[]'::jsonb),
    'people', coalesce((select jsonb_agg(jsonb_build_object('id', m.id, 'name', m.name, 'photo', m.photo))
                from public.v_members m where m.team_id = p.team_id and (
                  m.id in (select c.author_id from public.version_comments c join public.versions v on v.id = c.version_id where v.project_id = p.id)
                  or m.id in (select r.author_id from public.version_replies r join public.version_comments c on c.id = r.comment_id join public.versions v on v.id = c.version_id where v.project_id = p.id))), '[]'::jsonb));
end $$;

-- a guest can post about 60 things every ten minutes per project; enough for a real review, not for a flood
create or replace function public.guest_check(p public.projects, k text, p_name text) returns void
language plpgsql stable security definer set search_path = public as $$
begin
  if k is null then raise exception 'This browser is missing its guest key. Reload the page.'; end if;
  if p_name is null or length(btrim(p_name)) = 0 or length(p_name) > 60 then raise exception 'Add your name first.'; end if;
  if (select count(*) from public.version_comments c join public.versions v on v.id = c.version_id
        where v.project_id = p.id and c.guest_key = k and c.created_at > now() - interval '10 minutes')
   + (select count(*) from public.version_replies r join public.version_comments c on c.id = r.comment_id join public.versions v on v.id = c.version_id
        where v.project_id = p.id and r.guest_key = k and r.created_at > now() - interval '10 minutes') >= 60
  then raise exception 'That is a lot of comments in a short time. Wait a few minutes and try again.'; end if;
end $$;

create or replace function public.share_comment(p_token text, p_key text, p_name text, p_version uuid, p_id uuid, p_body text,
  p_sel text default null, p_rx real default null, p_ry real default null, p_px real default null, p_py real default null,
  p_dev text default null, p_snippet text default null) returns jsonb
language plpgsql security definer set search_path = public as $$
declare p public.projects; k text := public.guest_hash(p_key); n_ integer;
begin
  select * into p from public.shared_project(p_token);
  if p.id is null then raise exception 'This link is turned off.'; end if;
  if not exists (select 1 from public.versions where id = p_version and project_id = p.id) then raise exception 'That version is not part of this project.'; end if;
  if p_body is null or length(btrim(p_body)) = 0 or length(p_body) > 1000 then raise exception 'Comments are 1 to 1000 characters.'; end if;
  perform public.guest_check(p, k, p_name);
  if exists (select 1 from public.version_comments where id = p_id) then
    return (select jsonb_build_object('id', id, 'n', n) from public.version_comments where id = p_id and guest_key = k);
  end if;
  select coalesce(max(n), 0) + 1 into n_ from public.version_comments where version_id = p_version;
  insert into public.version_comments (id, version_id, team_id, n, sel, rx, ry, px, py, dev, body, author_id, guest_name, guest_key, snippet, status)
  values (p_id, p_version, p.team_id, n_, left(p_sel, 1000), p_rx, p_ry, p_px, p_py,
          case when p_dev in ('desktop', 'tablet', 'phone') then p_dev else 'desktop' end,
          btrim(p_body), null, btrim(p_name), k, left(p_snippet, 2000), 'open');
  update public.projects set changed_at = now(), changed_by = null, changed_guest = btrim(p_name) where id = p.id;
  return jsonb_build_object('id', p_id, 'n', n_);
end $$;

create or replace function public.share_reply(p_token text, p_key text, p_name text, p_comment uuid, p_id uuid, p_body text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare p public.projects; k text := public.guest_hash(p_key);
begin
  select * into p from public.shared_project(p_token);
  if p.id is null then raise exception 'This link is turned off.'; end if;
  if not exists (select 1 from public.version_comments c join public.versions v on v.id = c.version_id where c.id = p_comment and v.project_id = p.id)
    then raise exception 'That comment is not part of this project.'; end if;
  if p_body is null or length(btrim(p_body)) = 0 or length(p_body) > 1000 then raise exception 'Replies are 1 to 1000 characters.'; end if;
  perform public.guest_check(p, k, p_name);
  insert into public.version_replies (id, comment_id, team_id, author_id, guest_name, guest_key, body)
  values (p_id, p_comment, p.team_id, null, btrim(p_name), k, btrim(p_body)) on conflict (id) do nothing;
  update public.projects set changed_at = now(), changed_by = null, changed_guest = btrim(p_name) where id = p.id;
  return jsonb_build_object('id', p_id);
end $$;

-- a guest removes what they wrote from this browser, nothing else
create or replace function public.share_delete(p_token text, p_key text, p_id uuid) returns boolean
language plpgsql security definer set search_path = public as $$
declare p public.projects; k text := public.guest_hash(p_key); hit integer;
begin
  select * into p from public.shared_project(p_token);
  if p.id is null or k is null then return false; end if;
  delete from public.version_replies r using public.version_comments c, public.versions v
    where r.id = p_id and r.guest_key = k and c.id = r.comment_id and v.id = c.version_id and v.project_id = p.id;
  get diagnostics hit = row_count;
  if hit = 0 then
    delete from public.version_comments c using public.versions v
      where c.id = p_id and c.guest_key = k and v.id = c.version_id and v.project_id = p.id;
    get diagnostics hit = row_count;
  end if;
  return hit > 0;
end $$;

revoke execute on function public.shared_project(text) from public, anon, authenticated;
revoke execute on function public.guest_check(public.projects, text, text) from public, anon, authenticated;
revoke execute on function public.share_open(text, text) from public;
revoke execute on function public.share_comment(text, text, text, uuid, uuid, text, text, real, real, real, real, text, text) from public;
revoke execute on function public.share_reply(text, text, text, uuid, uuid, text) from public;
revoke execute on function public.share_delete(text, text, uuid) from public;
grant execute on function public.share_open(text, text) to anon, authenticated;
grant execute on function public.share_comment(text, text, text, uuid, uuid, text, text, real, real, real, real, text, text) to anon, authenticated;
grant execute on function public.share_reply(text, text, text, uuid, uuid, text) to anon, authenticated;
grant execute on function public.share_delete(text, text, uuid) to anon, authenticated;

-- the files of a shared project can be read by anyone holding the link (the paths are only handed out by share_open)
create or replace function public.project_is_shared(p_team text, p_project text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.projects where id::text = p_project and team_id::text = p_team and share_on);
$$;
drop policy if exists "project-files: shared read" on storage.objects;
create policy "project-files: shared read" on storage.objects for select to anon, authenticated
  using (bucket_id = 'project-files' and public.project_is_shared((storage.foldername(name))[1], (storage.foldername(name))[2]));

-- ---------------------------------------------------------------- the Claude connector
create table if not exists public.api_tokens (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name         text not null default 'Claude' check (length(name) <= 60),
  token_hash   text not null unique check (token_hash ~ '^[0-9a-f]{64}$'),
  hint         text check (hint is null or length(hint) <= 12),   -- the last characters, to tell keys apart
  created_at   timestamptz not null default now(),
  last_used_at timestamptz
);
create index if not exists api_tokens_user_idx on public.api_tokens(user_id);
alter table public.api_tokens enable row level security;
drop policy if exists "api_tokens: mine"   on public.api_tokens;
drop policy if exists "api_tokens: add"    on public.api_tokens;
drop policy if exists "api_tokens: remove" on public.api_tokens;
create policy "api_tokens: mine"   on public.api_tokens for select to authenticated using (user_id = (select auth.uid()));
create policy "api_tokens: add"    on public.api_tokens for insert to authenticated with check (user_id = (select auth.uid()));
create policy "api_tokens: remove" on public.api_tokens for delete to authenticated using (user_id = (select auth.uid()));

-- ================================================================ 2026-10-27: comment layers (team in the app, client on the link)
-- (also in supabase/2026-10-27-comment-layers.sql; applied as migration noon_comment_layers; replaces share_open, share_comment, share_reply above)

alter table public.version_comments add column if not exists layer text not null default 'team';
alter table public.version_comments drop constraint if exists version_comments_layer_check;
alter table public.version_comments add constraint version_comments_layer_check check (layer in ('team', 'client'));
update public.version_comments set layer = 'client' where guest_name is not null and layer <> 'client';
create index if not exists version_comments_layer_idx on public.version_comments(version_id, layer);

-- the link shows the client layer only, and the names of whoever wrote in it
create or replace function public.share_open(p_token text, p_key text default null) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare p public.projects; k text := public.guest_hash(p_key);
begin
  select * into p from public.shared_project(p_token);
  if p.id is null then return null; end if;
  return jsonb_build_object(
    'project', jsonb_build_object('id', p.id, 'team_id', p.team_id, 'name', p.name, 'changed_at', p.changed_at,
                                  'team', (select t.name from public.teams t where t.id = p.team_id)),
    'versions', coalesce((select jsonb_agg(jsonb_build_object('id', v.id, 'n', v.n, 'name', v.name, 'path', v.path, 'size', v.size,
                  'file', v.file, 'assets', v.assets, 'created_at', v.created_at) order by v.n)
                from public.versions v where v.project_id = p.id), '[]'::jsonb),
    'comments', coalesce((select jsonb_agg(jsonb_build_object('id', c.id, 'version_id', c.version_id, 'n', c.n, 'sel', c.sel, 'rx', c.rx, 'ry', c.ry,
                  'px', c.px, 'py', c.py, 'dev', c.dev, 'body', c.body, 'author_id', c.author_id, 'guest_name', c.guest_name,
                  'status', c.status, 'from_version', c.from_version, 'created_at', c.created_at,
                  'mine', (k is not null and c.guest_key = k)) order by c.n)
                from public.version_comments c join public.versions v on v.id = c.version_id
                where v.project_id = p.id and c.layer = 'client'), '[]'::jsonb),
    'replies', coalesce((select jsonb_agg(jsonb_build_object('id', r.id, 'comment_id', r.comment_id, 'body', r.body, 'author_id', r.author_id,
                  'guest_name', r.guest_name, 'created_at', r.created_at, 'mine', (k is not null and r.guest_key = k)) order by r.created_at)
                from public.version_replies r join public.version_comments c on c.id = r.comment_id join public.versions v on v.id = c.version_id
                where v.project_id = p.id and c.layer = 'client'), '[]'::jsonb),
    'people', coalesce((select jsonb_agg(jsonb_build_object('id', m.id, 'name', m.name, 'photo', m.photo))
                from public.v_members m where m.team_id = p.team_id and (
                  m.id in (select c.author_id from public.version_comments c join public.versions v on v.id = c.version_id where v.project_id = p.id and c.layer = 'client')
                  or m.id in (select r.author_id from public.version_replies r join public.version_comments c on c.id = r.comment_id join public.versions v on v.id = c.version_id
                              where v.project_id = p.id and c.layer = 'client'))), '[]'::jsonb));
end $$;

-- a comment left on the link is in the client layer and numbered there
create or replace function public.share_comment(p_token text, p_key text, p_name text, p_version uuid, p_id uuid, p_body text,
  p_sel text default null, p_rx real default null, p_ry real default null, p_px real default null, p_py real default null,
  p_dev text default null, p_snippet text default null) returns jsonb
language plpgsql security definer set search_path = public as $$
declare p public.projects; k text := public.guest_hash(p_key); n_ integer;
begin
  select * into p from public.shared_project(p_token);
  if p.id is null then raise exception 'This link is turned off.'; end if;
  if not exists (select 1 from public.versions where id = p_version and project_id = p.id) then raise exception 'That version is not part of this project.'; end if;
  if p_body is null or length(btrim(p_body)) = 0 or length(p_body) > 1000 then raise exception 'Comments are 1 to 1000 characters.'; end if;
  perform public.guest_check(p, k, p_name);
  if exists (select 1 from public.version_comments where id = p_id) then
    return (select jsonb_build_object('id', id, 'n', n) from public.version_comments where id = p_id and guest_key = k);
  end if;
  select coalesce(max(n), 0) + 1 into n_ from public.version_comments where version_id = p_version and layer = 'client';
  insert into public.version_comments (id, version_id, team_id, n, sel, rx, ry, px, py, dev, body, author_id, guest_name, guest_key, snippet, status, layer)
  values (p_id, p_version, p.team_id, n_, left(p_sel, 1000), p_rx, p_ry, p_px, p_py,
          case when p_dev in ('desktop', 'tablet', 'phone') then p_dev else 'desktop' end,
          btrim(p_body), null, btrim(p_name), k, left(p_snippet, 2000), 'open', 'client');
  update public.projects set changed_at = now(), changed_by = null, changed_guest = btrim(p_name) where id = p.id;
  return jsonb_build_object('id', p_id, 'n', n_);
end $$;

-- replies on the link only go on client-layer comments
create or replace function public.share_reply(p_token text, p_key text, p_name text, p_comment uuid, p_id uuid, p_body text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare p public.projects; k text := public.guest_hash(p_key);
begin
  select * into p from public.shared_project(p_token);
  if p.id is null then raise exception 'This link is turned off.'; end if;
  if not exists (select 1 from public.version_comments c join public.versions v on v.id = c.version_id
                 where c.id = p_comment and v.project_id = p.id and c.layer = 'client')
    then raise exception 'That comment is not part of this review.'; end if;
  if p_body is null or length(btrim(p_body)) = 0 or length(p_body) > 1000 then raise exception 'Replies are 1 to 1000 characters.'; end if;
  perform public.guest_check(p, k, p_name);
  insert into public.version_replies (id, comment_id, team_id, author_id, guest_name, guest_key, body)
  values (p_id, p_comment, p.team_id, null, btrim(p_name), k, btrim(p_body)) on conflict (id) do nothing;
  update public.projects set changed_at = now(), changed_by = null, changed_guest = btrim(p_name) where id = p.id;
  return jsonb_build_object('id', p_id);
end $$;

revoke execute on function public.share_open(text, text) from public;
revoke execute on function public.share_comment(text, text, text, uuid, uuid, text, text, real, real, real, real, text, text) from public;
revoke execute on function public.share_reply(text, text, text, uuid, uuid, text) from public;
grant execute on function public.share_open(text, text) to anon, authenticated;
grant execute on function public.share_comment(text, text, text, uuid, uuid, text, text, real, real, real, real, text, text) to anon, authenticated;
grant execute on function public.share_reply(text, text, text, uuid, uuid, text) to anon, authenticated;

-- ---------------------------------------------------------------- client links per version
-- (also in supabase/2026-10-28-version-links.sql; applied as migration noon_version_links; replaces shared_project,
-- share_open, share_comment, share_reply, share_delete and the shared-read file policy above)

alter table public.versions add column if not exists share_on boolean not null default false;
alter table public.versions add column if not exists share_token text;
create unique index if not exists versions_share_token_idx on public.versions(share_token) where share_token is not null;
alter table public.versions drop constraint if exists versions_share_token_check;
alter table public.versions add constraint versions_share_token_check check (share_token is null or share_token ~ '^[A-Za-z0-9_-]{20,64}$');

-- the version behind a live link, or nothing
create or replace function public.shared_version(p_token text) returns public.versions
language sql stable security definer set search_path = public as $$
  select * from public.versions where p_token ~ '^[A-Za-z0-9_-]{20,64}$' and share_token = p_token and share_on limit 1;
$$;

-- the project that version belongs to
create or replace function public.shared_project(p_token text) returns public.projects
language sql stable security definer set search_path = public as $$
  select p.* from public.projects p join public.versions v on v.project_id = p.id
  where p_token ~ '^[A-Za-z0-9_-]{20,64}$' and v.share_token = p_token and v.share_on limit 1;
$$;

-- what a client sees: the project's name, the one version, its client-layer comments and replies, and who wrote them
create or replace function public.share_open(p_token text, p_key text default null) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare p public.projects; sv public.versions; k text := public.guest_hash(p_key);
begin
  select * into sv from public.shared_version(p_token);
  if sv.id is null then return null; end if;
  select * into p from public.projects where id = sv.project_id;
  return jsonb_build_object(
    'project', jsonb_build_object('id', p.id, 'team_id', p.team_id, 'name', p.name, 'changed_at', p.changed_at,
                                  'team', (select t.name from public.teams t where t.id = p.team_id)),
    'versions', jsonb_build_array(jsonb_build_object('id', sv.id, 'n', sv.n, 'name', sv.name, 'path', sv.path, 'size', sv.size,
                  'file', sv.file, 'assets', sv.assets, 'created_at', sv.created_at)),
    'comments', coalesce((select jsonb_agg(jsonb_build_object('id', c.id, 'version_id', c.version_id, 'n', c.n, 'sel', c.sel, 'rx', c.rx, 'ry', c.ry,
                  'px', c.px, 'py', c.py, 'dev', c.dev, 'body', c.body, 'author_id', c.author_id, 'guest_name', c.guest_name,
                  'status', c.status, 'from_version', c.from_version, 'created_at', c.created_at,
                  'mine', (k is not null and c.guest_key = k)) order by c.n)
                from public.version_comments c where c.version_id = sv.id and c.layer = 'client'), '[]'::jsonb),
    'replies', coalesce((select jsonb_agg(jsonb_build_object('id', r.id, 'comment_id', r.comment_id, 'body', r.body, 'author_id', r.author_id,
                  'guest_name', r.guest_name, 'created_at', r.created_at, 'mine', (k is not null and r.guest_key = k)) order by r.created_at)
                from public.version_replies r join public.version_comments c on c.id = r.comment_id
                where c.version_id = sv.id and c.layer = 'client'), '[]'::jsonb),
    'people', coalesce((select jsonb_agg(jsonb_build_object('id', m.id, 'name', m.name, 'photo', m.photo))
                from public.v_members m where m.team_id = p.team_id and (
                  m.id in (select c.author_id from public.version_comments c where c.version_id = sv.id and c.layer = 'client')
                  or m.id in (select r.author_id from public.version_replies r join public.version_comments c on c.id = r.comment_id
                              where c.version_id = sv.id and c.layer = 'client'))), '[]'::jsonb));
end $$;

-- a comment left on the link goes on the linked version, in the client layer
create or replace function public.share_comment(p_token text, p_key text, p_name text, p_version uuid, p_id uuid, p_body text,
  p_sel text default null, p_rx real default null, p_ry real default null, p_px real default null, p_py real default null,
  p_dev text default null, p_snippet text default null) returns jsonb
language plpgsql security definer set search_path = public as $$
declare p public.projects; sv public.versions; k text := public.guest_hash(p_key); n_ integer;
begin
  select * into sv from public.shared_version(p_token);
  if sv.id is null then raise exception 'This link is turned off.'; end if;
  if p_version is distinct from sv.id then raise exception 'That version is not part of this review.'; end if;
  select * into p from public.projects where id = sv.project_id;
  if p_body is null or length(btrim(p_body)) = 0 or length(p_body) > 1000 then raise exception 'Comments are 1 to 1000 characters.'; end if;
  perform public.guest_check(p, k, p_name);
  if exists (select 1 from public.version_comments where id = p_id) then
    return (select jsonb_build_object('id', id, 'n', n) from public.version_comments where id = p_id and guest_key = k);
  end if;
  select coalesce(max(n), 0) + 1 into n_ from public.version_comments where version_id = sv.id and layer = 'client';
  insert into public.version_comments (id, version_id, team_id, n, sel, rx, ry, px, py, dev, body, author_id, guest_name, guest_key, snippet, status, layer)
  values (p_id, sv.id, p.team_id, n_, left(p_sel, 1000), p_rx, p_ry, p_px, p_py,
          case when p_dev in ('desktop', 'tablet', 'phone') then p_dev else 'desktop' end,
          btrim(p_body), null, btrim(p_name), k, left(p_snippet, 2000), 'open', 'client');
  update public.projects set changed_at = now(), changed_by = null, changed_guest = btrim(p_name) where id = p.id;
  return jsonb_build_object('id', p_id, 'n', n_);
end $$;

-- replies on the link only go on the linked version's client-layer comments
create or replace function public.share_reply(p_token text, p_key text, p_name text, p_comment uuid, p_id uuid, p_body text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare p public.projects; sv public.versions; k text := public.guest_hash(p_key);
begin
  select * into sv from public.shared_version(p_token);
  if sv.id is null then raise exception 'This link is turned off.'; end if;
  if not exists (select 1 from public.version_comments c where c.id = p_comment and c.version_id = sv.id and c.layer = 'client')
    then raise exception 'That comment is not part of this review.'; end if;
  select * into p from public.projects where id = sv.project_id;
  if p_body is null or length(btrim(p_body)) = 0 or length(p_body) > 1000 then raise exception 'Replies are 1 to 1000 characters.'; end if;
  perform public.guest_check(p, k, p_name);
  insert into public.version_replies (id, comment_id, team_id, author_id, guest_name, guest_key, body)
  values (p_id, p_comment, p.team_id, null, btrim(p_name), k, btrim(p_body)) on conflict (id) do nothing;
  update public.projects set changed_at = now(), changed_by = null, changed_guest = btrim(p_name) where id = p.id;
  return jsonb_build_object('id', p_id);
end $$;

-- a guest removes what they wrote from this browser, on the linked version, nothing else
create or replace function public.share_delete(p_token text, p_key text, p_id uuid) returns boolean
language plpgsql security definer set search_path = public as $$
declare sv public.versions; k text := public.guest_hash(p_key); hit integer;
begin
  select * into sv from public.shared_version(p_token);
  if sv.id is null or k is null then return false; end if;
  delete from public.version_replies r using public.version_comments c
    where r.id = p_id and r.guest_key = k and c.id = r.comment_id and c.version_id = sv.id;
  get diagnostics hit = row_count;
  if hit = 0 then
    delete from public.version_comments c where c.id = p_id and c.guest_key = k and c.version_id = sv.id;
    get diagnostics hit = row_count;
  end if;
  return hit > 0;
end $$;

revoke execute on function public.shared_version(text) from public, anon, authenticated;
revoke execute on function public.shared_project(text) from public, anon, authenticated;
revoke execute on function public.share_open(text, text) from public;
revoke execute on function public.share_comment(text, text, text, uuid, uuid, text, text, real, real, real, real, text, text) from public;
revoke execute on function public.share_reply(text, text, text, uuid, uuid, text) from public;
revoke execute on function public.share_delete(text, text, uuid) from public;
grant execute on function public.share_open(text, text) to anon, authenticated;
grant execute on function public.share_comment(text, text, text, uuid, uuid, text, text, real, real, real, real, text, text) to anon, authenticated;
grant execute on function public.share_reply(text, text, text, uuid, uuid, text) to anon, authenticated;
grant execute on function public.share_delete(text, text, uuid) to anon, authenticated;

-- a file can be read through a link only when it is the page or one of the files of a version whose link is on
create or replace function public.file_is_shared(p_name text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.versions v where v.share_on
    and (v.file = p_name or v.assets @> jsonb_build_array(jsonb_build_object('file', p_name))));
$$;
revoke execute on function public.file_is_shared(text) from public;
grant execute on function public.file_is_shared(text) to anon, authenticated;
drop policy if exists "project-files: shared read" on storage.objects;
create policy "project-files: shared read" on storage.objects for select to anon, authenticated
  using (bucket_id = 'project-files' and public.file_is_shared(name));
drop function if exists public.project_is_shared(text, text);

-- ---------------------------------------------------------------- invites are requests (2026-10-28-team-requests.sql)

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
