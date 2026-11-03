-- Templates and steps: a project as a checklist.
-- flows         the team's templates: the questions asked when a project starts, then stages and steps (in body)
-- tasks         a task can be a step in a project: its stage, its place, what comes before it (in flow), and a priority
-- projects.flow the copy of the template a project runs on, with the answers to its questions
-- project_events what happened on a project, who did it and when, kept so the history can be read back later

create table if not exists public.flows (
  id         uuid primary key default gen_random_uuid(),
  team_id    uuid not null references public.teams(id) on delete cascade,
  name       text not null check (length(name) <= 80),
  body       jsonb not null default '{}'::jsonb,
  created_by uuid references public.members(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists flows_team_idx on public.flows(team_id);

alter table public.tasks add column if not exists project_id uuid references public.projects(id) on delete cascade;
alter table public.tasks add column if not exists version_id uuid references public.versions(id) on delete set null;
alter table public.tasks add column if not exists flow jsonb;
alter table public.tasks add column if not exists priority text;
create index if not exists tasks_project_idx on public.tasks(project_id);
alter table public.projects add column if not exists flow jsonb;

create table if not exists public.project_events (
  id         uuid primary key default gen_random_uuid(),
  team_id    uuid not null references public.teams(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  task_id    uuid,               -- no reference: the record stays when a task is deleted
  type       text not null,
  actor      uuid references public.members(id) on delete set null,
  data       jsonb not null default '{}'::jsonb,
  at         timestamptz not null default now()
);
create index if not exists project_events_project_idx on public.project_events(project_id, at);

alter table public.flows enable row level security;
alter table public.project_events enable row level security;

create policy "flows: teammates" on public.flows for all using (public.is_member(team_id)) with check (public.is_member(team_id));
create policy "project_events: teammates" on public.project_events for all using (public.is_member(team_id)) with check (public.is_member(team_id));

-- a project's steps belong to everyone on the team: anyone on it can tick, add or reassign a step
drop policy if exists "tasks: edit" on public.tasks;
create policy "tasks: edit" on public.tasks for update using (
  created_by = public.my_member_id(team_id)
  or (project_id is not null and public.is_member(team_id))
  or exists (select 1 from public.task_assignees ta join public.members m on m.id = ta.member_id where ta.task_id = tasks.id and m.user_id = auth.uid()));
drop policy if exists "tasks: remove" on public.tasks;
create policy "tasks: remove" on public.tasks for delete using (
  created_by = public.my_member_id(team_id)
  or (project_id is not null and public.is_member(team_id))
  or exists (select 1 from public.task_assignees ta join public.members m on m.id = ta.member_id where ta.task_id = tasks.id and m.user_id = auth.uid()));

alter publication supabase_realtime add table public.flows, public.project_events;
