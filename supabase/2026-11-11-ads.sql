-- Noon: static ads. A page's third tab, next to Copy and Design: ad images (usually AI-made) uploaded in batches, that
-- the team approves or rejects and comments on. Every ad keeps three files in project-files under
-- <team>/<page>/ads/<ad>/: a small thumbnail for the grid, a review copy the team looks at (2000px at most) and the
-- full-size original. The originals of rejected ads can be removed to free space: original goes null, and the review
-- copy, the decision and the comments stay. Comments pin to a spot on the image (x and y from 0 to 1), or to the whole
-- ad when both are null. Safe to run more than once.
create table if not exists public.ads (
  id          uuid primary key,
  project_id  uuid not null references public.projects(id) on delete cascade,
  team_id     uuid not null references public.teams(id) on delete cascade,
  n           integer not null,                                   -- Ad 1, Ad 2, … on the page
  batch       integer not null default 1,                         -- the upload it came in with
  name        text not null default '' check (length(name) <= 200),  -- the file it came from
  w           integer,                                            -- the original's size in pixels and bytes
  h           integer,
  size        bigint,
  original    text,                                               -- storage paths; original is null once removed
  review      text,
  thumb       text,
  status      text not null default 'open' check (status in ('open', 'approved', 'rejected')),
  decided_by  uuid references public.members(id) on delete set null,
  decided_at  timestamptz,
  created_by  uuid references public.members(id) on delete set null,
  created_at  timestamptz not null default now()
);
create index if not exists ads_project_idx on public.ads(project_id, n);
create index if not exists ads_team_idx on public.ads(team_id);

create table if not exists public.ad_comments (
  id          uuid primary key,
  ad_id       uuid not null references public.ads(id) on delete cascade,
  team_id     uuid not null references public.teams(id) on delete cascade,
  n           integer not null,
  x           real check (x is null or (x >= 0 and x <= 1)),
  y           real check (y is null or (y >= 0 and y <= 1)),
  body        text not null check (length(body) between 1 and 1000),
  author_id   uuid references public.members(id) on delete set null,
  status      text not null default 'open' check (status in ('open', 'resolved')),
  created_at  timestamptz not null default now()
);
create index if not exists ad_comments_ad_idx on public.ad_comments(ad_id);
create index if not exists ad_comments_team_idx on public.ad_comments(team_id);

create table if not exists public.ad_replies (
  id         uuid primary key,
  comment_id uuid not null references public.ad_comments(id) on delete cascade,
  team_id    uuid not null references public.teams(id) on delete cascade,
  author_id  uuid references public.members(id) on delete set null,
  body       text not null check (length(body) between 1 and 1000),
  created_at timestamptz not null default now()
);
create index if not exists ad_replies_comment_idx on public.ad_replies(comment_id);
create index if not exists ad_replies_team_idx on public.ad_replies(team_id);

alter table public.ads         enable row level security;
alter table public.ad_comments enable row level security;
alter table public.ad_replies  enable row level security;

-- teammates see, add, decide on and remove ads; a comment's status changes for the whole team; you remove what you wrote
drop policy if exists "ads: teammates" on public.ads;
create policy "ads: teammates" on public.ads for all using (public.is_member(team_id)) with check (public.is_member(team_id));
drop policy if exists "ad_comments: teammates"  on public.ad_comments;
drop policy if exists "ad_comments: add own"    on public.ad_comments;
drop policy if exists "ad_comments: edit"       on public.ad_comments;
drop policy if exists "ad_comments: remove own" on public.ad_comments;
create policy "ad_comments: teammates"  on public.ad_comments for select using (public.is_member(team_id));
create policy "ad_comments: add own"    on public.ad_comments for insert with check (public.is_member(team_id) and (author_id is null or author_id = public.my_member_id(team_id)));
create policy "ad_comments: edit"       on public.ad_comments for update using (public.is_member(team_id)) with check (public.is_member(team_id));
create policy "ad_comments: remove own" on public.ad_comments for delete using (author_id = public.my_member_id(team_id) or author_id is null);
drop policy if exists "ad_replies: teammates"  on public.ad_replies;
drop policy if exists "ad_replies: add own"    on public.ad_replies;
drop policy if exists "ad_replies: remove own" on public.ad_replies;
create policy "ad_replies: teammates"  on public.ad_replies for select using (public.is_member(team_id));
create policy "ad_replies: add own"    on public.ad_replies for insert with check (public.is_member(team_id) and (author_id is null or author_id = public.my_member_id(team_id)));
create policy "ad_replies: remove own" on public.ad_replies for delete using (author_id = public.my_member_id(team_id) or author_id is null);

-- an ad belongs to its page's team, a comment to its ad's team, a reply to its comment's team
-- (nested ifs: PL/pgSQL resolves every field named in one condition, and each table has different ones)
create or replace function public.check_ad_links() returns trigger
language plpgsql set search_path = public as $$
begin
  if tg_table_name = 'ads' then
    if not exists (select 1 from public.projects p where p.id = new.project_id and p.team_id = new.team_id) then raise exception 'That page is in another team'; end if;
  elsif tg_table_name = 'ad_comments' then
    if not exists (select 1 from public.ads a where a.id = new.ad_id and a.team_id = new.team_id) then raise exception 'That ad is in another team'; end if;
  elsif tg_table_name = 'ad_replies' then
    if not exists (select 1 from public.ad_comments c where c.id = new.comment_id and c.team_id = new.team_id) then raise exception 'That comment is in another team'; end if;
  end if;
  return new;
end $$;
drop trigger if exists ads_links on public.ads;
create trigger ads_links before insert or update of project_id, team_id on public.ads for each row execute function public.check_ad_links();
drop trigger if exists ad_comments_links on public.ad_comments;
create trigger ad_comments_links before insert or update of ad_id, team_id on public.ad_comments for each row execute function public.check_ad_links();
drop trigger if exists ad_replies_links on public.ad_replies;
create trigger ad_replies_links before insert or update of comment_id, team_id on public.ad_replies for each row execute function public.check_ad_links();

-- full-size ad images reach 20 MB and more at 4K: files up to 50 MB, the most the Free plan allows
update storage.buckets set file_size_limit = 52428800 where id = 'project-files' and coalesce(file_size_limit, 0) < 52428800;

-- teammates see each other's ads, decisions and comments arrive live
do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'ads') then
    alter publication supabase_realtime add table public.ads;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'ad_comments') then
    alter publication supabase_realtime add table public.ad_comments;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'ad_replies') then
    alter publication supabase_realtime add table public.ad_replies;
  end if;
end $$;
