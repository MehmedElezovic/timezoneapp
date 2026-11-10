-- Noon: clients, folders and categories.
-- folders     a client is a folder with no parent; folders nest inside it. The app moves what is inside a folder
--             before deleting it, so pages are never lost with a folder.
-- projects    a page is still a projects row (its design versions, comments, client links and the Claude connector
--             work as before). It gains folder_id, the folder it sits in (none: not in a client yet), and cats, the ids
--             of the categories picked on it.
-- categories  the team's lists. A row with no parent_id is a list (Audience, Page type…) for clients or for pages;
--             the rows that point at it are its choices. Every team starts with the same four lists.
-- Safe to run more than once.

create table if not exists public.folders (
  id         uuid primary key default gen_random_uuid(),
  team_id    uuid not null references public.teams(id) on delete cascade,
  parent_id  uuid references public.folders(id) on delete set null,
  name       text not null check (length(name) <= 60),
  cats       jsonb not null default '[]'::jsonb,       -- category ids, for a client
  created_by uuid references public.members(id) on delete set null,
  changed_by uuid references public.members(id) on delete set null,
  changed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index if not exists folders_team_idx on public.folders(team_id);
create index if not exists folders_parent_idx on public.folders(parent_id);

alter table public.projects add column if not exists folder_id uuid references public.folders(id) on delete set null;
alter table public.projects add column if not exists cats jsonb not null default '[]'::jsonb;
create index if not exists projects_folder_idx on public.projects(folder_id);

create table if not exists public.categories (
  id         uuid primary key default gen_random_uuid(),
  team_id    uuid not null references public.teams(id) on delete cascade,
  parent_id  uuid references public.categories(id) on delete cascade,
  level      text not null check (level in ('client', 'page')),
  name       text not null check (length(name) <= 40),
  sort       integer not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists categories_team_idx on public.categories(team_id, sort);

alter table public.folders    enable row level security;
alter table public.categories enable row level security;

-- everyone on the team sees, adds, renames, moves and removes clients, folders and categories
drop policy if exists "folders: teammates" on public.folders;
create policy "folders: teammates" on public.folders for all using (public.is_member(team_id)) with check (public.is_member(team_id));
drop policy if exists "categories: teammates" on public.categories;
create policy "categories: teammates" on public.categories for all using (public.is_member(team_id)) with check (public.is_member(team_id));

-- a folder's parent, a page's folder and a choice's list belong to the same team, and a folder never goes inside itself.
-- The table check comes first on its own: PL/pgSQL looks up every field in a condition, so new.folder_id on a
-- categories row would fail even behind tg_table_name = 'projects'.
create or replace function public.check_folder_links() returns trigger
language plpgsql set search_path = public as $$
begin
  if tg_table_name = 'folders' then
    if new.parent_id is not null then
      if not exists (select 1 from public.folders f where f.id = new.parent_id and f.team_id = new.team_id) then
        raise exception 'That folder is in another team';
      end if;
      if exists (
        with recursive up as (
          select id, parent_id from public.folders where id = new.parent_id
          union all
          select f.id, f.parent_id from public.folders f join up on f.id = up.parent_id
        ) select 1 from up where id = new.id) then
        raise exception 'A folder cannot go inside itself';
      end if;
    end if;
  elsif tg_table_name = 'projects' then
    if new.folder_id is not null and not exists (select 1 from public.folders f where f.id = new.folder_id and f.team_id = new.team_id) then
      raise exception 'That folder is in another team';
    end if;
  elsif tg_table_name = 'categories' then
    if new.parent_id is not null and not exists (select 1 from public.categories c where c.id = new.parent_id and c.team_id = new.team_id and c.parent_id is null and c.level = new.level) then
      raise exception 'That list is in another team';
    end if;
  end if;
  return new;
end $$;
drop trigger if exists folders_links on public.folders;
create trigger folders_links before insert or update of parent_id on public.folders for each row execute function public.check_folder_links();
drop trigger if exists projects_folder_link on public.projects;
create trigger projects_folder_link before insert or update of folder_id on public.projects for each row execute function public.check_folder_links();
drop trigger if exists categories_links on public.categories;
create trigger categories_links before insert or update of parent_id, level on public.categories for each row execute function public.check_folder_links();

-- the lists every team starts with; the team edits them in Settings › Categories
create or replace function public.seed_categories(t uuid) returns void
language plpgsql security definer set search_path = public as $$
declare
  lists jsonb := '[
    ["client", "Audience",  ["B2B", "DTC"]],
    ["client", "Industry",  ["Telehealth", "Supplements", "Beauty and skincare", "Dental", "Food and drink"]],
    ["page",   "Page type", ["Advertorial", "Listicle", "Product page", "Sales page", "Landing page", "Comparison", "Quiz"]],
    ["page",   "Style",     ["Editorial", "Scrappy", "Branded"]]
  ]';
  l jsonb; g uuid; i integer := 0;
begin
  if exists (select 1 from public.categories where team_id = t) then return; end if;
  for l in select value from jsonb_array_elements(lists) loop
    insert into public.categories (team_id, level, name, sort) values (t, l->>0, l->>1, i) returning id into g;
    insert into public.categories (team_id, parent_id, level, name, sort)
      select t, g, l->>0, x.v, (x.n - 1)::integer from jsonb_array_elements_text(l->2) with ordinality as x(v, n);
    i := i + 1;
  end loop;
end $$;
revoke all on function public.seed_categories(uuid) from public, anon, authenticated;

create or replace function public.teams_seed_categories() returns trigger
language plpgsql security definer set search_path = public as $$
begin perform public.seed_categories(new.id); return new; end $$;
revoke all on function public.teams_seed_categories() from public, anon, authenticated;
drop trigger if exists teams_seed_categories on public.teams;
create trigger teams_seed_categories after insert on public.teams for each row execute function public.teams_seed_categories();

do $$ declare r record; begin for r in select id from public.teams loop perform public.seed_categories(r.id); end loop; end $$;

do $$ begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'folders') then
    alter publication supabase_realtime add table public.folders;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'categories') then
    alter publication supabase_realtime add table public.categories;
  end if;
end $$;
