-- Noon: projects. A project is a stack of versions (every uploaded HTML file is the next one), comments pin to the
-- page of one version, replies hang off a comment. The rows live here, the files (the page and whatever was dropped
-- with it) in the private bucket project-files under <team_id>/<project_id>/<version_id>/<path>.
-- Safe to run more than once.

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
