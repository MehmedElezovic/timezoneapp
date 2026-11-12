-- Noon: hidden tasks, and a task for everyone assigned to a page. A task is seen by the whole team unless whoever made it
-- hides it: from everyone (private: only the person who made it and the people it is for see it), or from chosen
-- teammates (hidden_from). The people it is for always see it. A hidden task's assignees, comment thread and files are
-- hidden with it, through public.task_visible. Only the person who made a task changes who can see it. Safe to run more
-- than once.
alter table public.tasks add column if not exists private boolean not null default false;
alter table public.tasks add column if not exists hidden_from uuid[] not null default '{}';

-- can the person signed in see this task? Security definer, so the rules of other tables can ask it without looping
-- back through the task tables' own rules.
create or replace function public.task_visible(tid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.tasks t
    where t.id = tid and public.is_member(t.team_id) and (
      t.created_by = public.my_member_id(t.team_id)
      or exists (select 1 from public.task_assignees ta where ta.task_id = t.id and ta.member_id = public.my_member_id(t.team_id))
      or (not t.private and not (public.my_member_id(t.team_id) = any(t.hidden_from)))));
$$;
revoke all on function public.task_visible(uuid) from public;
grant execute on function public.task_visible(uuid) to authenticated;

drop policy if exists "tasks: teammates" on public.tasks;
create policy "tasks: teammates" on public.tasks for select using (public.task_visible(id));
drop policy if exists "tasks: edit" on public.tasks;
create policy "tasks: edit" on public.tasks for update using (
  public.task_visible(id) and (
    created_by = public.my_member_id(team_id)
    or (project_id is not null and public.is_member(team_id))
    or exists (select 1 from public.task_assignees ta join public.members m on m.id = ta.member_id where ta.task_id = tasks.id and m.user_id = auth.uid())));
drop policy if exists "tasks: remove" on public.tasks;
create policy "tasks: remove" on public.tasks for delete using (
  public.task_visible(id) and (
    created_by = public.my_member_id(team_id)
    or (project_id is not null and public.is_member(team_id))
    or exists (select 1 from public.task_assignees ta join public.members m on m.id = ta.member_id where ta.task_id = tasks.id and m.user_id = auth.uid())));

drop policy if exists "task_assignees: teammates" on public.task_assignees;
create policy "task_assignees: teammates" on public.task_assignees for select using (public.task_visible(task_id));

drop policy if exists "threads: teammates" on public.threads;
create policy "threads: teammates" on public.threads for select using (public.is_member(team_id) and (task_id is null or public.task_visible(task_id)));

drop policy if exists "task-files: teammates read" on storage.objects;
create policy "task-files: teammates read" on storage.objects for select to authenticated
  using (bucket_id = 'task-files' and public.is_member(((storage.foldername(name))[1])::uuid)
         and public.task_visible(((storage.foldername(name))[2])::uuid));

-- who can see a task is the call of the person who made it
create or replace function public.task_privacy_guard() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if (new.private is distinct from old.private or new.hidden_from is distinct from old.hidden_from)
     and old.created_by is distinct from public.my_member_id(old.team_id) and auth.uid() is not null then
    raise exception 'Only the person who made this task can change who sees it';
  end if;
  return new;
end $$;
drop trigger if exists tasks_privacy on public.tasks;
create trigger tasks_privacy before update of private, hidden_from on public.tasks for each row execute function public.task_privacy_guard();

-- everyone already assigned to a page gets their task for it, once
with need as (
  select p.id pid, p.team_id, p.name, p.due_day, pa.member_id
  from public.project_assignees pa join public.projects p on p.id = pa.project_id
  where not exists (select 1 from public.tasks t join public.task_assignees ta on ta.task_id = t.id
                    where t.project_id = p.id and ta.member_id = pa.member_id and t.flow is null and t.done_at is null)
), made as (
  insert into public.tasks (id, team_id, title, project_id, due_day, created_by)
  select gen_random_uuid(), team_id, left(name, 120), pid, due_day, member_id from need
  returning id, project_id, created_by
)
insert into public.task_assignees (task_id, member_id) select id, created_by from made;
