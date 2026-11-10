-- Noon: copy. A page's copy is a stack of versions next to its design. Each version is the copy as clean HTML (only
-- headings, paragraphs, lists, quotes, lines, bold, italic, underline, highlight and links), and a saved version never
-- changes. Comments sit on a stretch of a version's text by character position; a suggestion carries the wording it
-- proposes, the team accepts or declines it, and applied_in is the version accepted wording went into. Review links
-- work per copy version, like design versions, through the copy_share_* functions. A page also keeps which copy
-- version and which design version are final. Safe to run more than once.

create table if not exists public.copy_versions (
  id          uuid primary key,
  project_id  uuid not null references public.projects(id) on delete cascade,
  team_id     uuid not null references public.teams(id) on delete cascade,
  n           integer not null,
  body        text not null check (length(body) <= 1000000),
  src         text check (src is null or length(src) <= 200),   -- 'written', or the name of the file it came from
  created_by  uuid references public.members(id) on delete set null,
  created_at  timestamptz not null default now(),
  share_on    boolean not null default false,
  share_token text check (share_token is null or share_token ~ '^[A-Za-z0-9_-]{20,64}$')
);
create index if not exists copy_versions_project_idx on public.copy_versions(project_id, n);
create index if not exists copy_versions_team_idx on public.copy_versions(team_id);
create unique index if not exists copy_versions_share_token_idx on public.copy_versions(share_token) where share_token is not null;

create table if not exists public.copy_comments (
  id              uuid primary key,
  copy_version_id uuid not null references public.copy_versions(id) on delete cascade,
  team_id         uuid not null references public.teams(id) on delete cascade,
  n               integer not null,
  layer           text not null default 'team' check (layer in ('team', 'client')),
  kind            text not null default 'comment' check (kind in ('comment', 'suggest')),
  at_start        integer not null check (at_start >= 0),     -- where in the version's text, in characters
  at_end          integer not null,
  quote           text not null check (length(quote) between 1 and 2000),   -- the words it is on
  body            text not null default '' check (length(body) <= 2000),     -- the comment, or why, for a suggestion
  replacement     text check (replacement is null or length(replacement) <= 5000),  -- a suggestion's new wording
  status          text not null default 'open' check (status in ('open', 'resolved', 'accepted', 'declined')),
  applied_in      integer,                                   -- the copy version accepted wording went into
  author_id       uuid references public.members(id) on delete set null,
  guest_name      text check (guest_name is null or length(guest_name) <= 60),
  guest_key       text,
  created_at      timestamptz not null default now(),
  constraint copy_comments_range check (at_end > at_start)
);
create index if not exists copy_comments_version_idx on public.copy_comments(copy_version_id);
create index if not exists copy_comments_team_idx on public.copy_comments(team_id);

create table if not exists public.copy_replies (
  id         uuid primary key,
  comment_id uuid not null references public.copy_comments(id) on delete cascade,
  team_id    uuid not null references public.teams(id) on delete cascade,
  author_id  uuid references public.members(id) on delete set null,
  guest_name text check (guest_name is null or length(guest_name) <= 60),
  guest_key  text,
  body       text not null check (length(body) between 1 and 1000),
  created_at timestamptz not null default now()
);
create index if not exists copy_replies_comment_idx on public.copy_replies(comment_id);
create index if not exists copy_replies_team_idx on public.copy_replies(team_id);

-- the final copy and the final design of a page (no reference: the app drops a mark whose version is gone)
alter table public.projects add column if not exists final_copy uuid;
alter table public.projects add column if not exists final_design uuid;

alter table public.copy_versions enable row level security;
alter table public.copy_comments enable row level security;
alter table public.copy_replies  enable row level security;

-- teammates see and add everything; a comment's status changes for the whole team; you remove what you wrote
drop policy if exists "copy_versions: teammates" on public.copy_versions;
create policy "copy_versions: teammates" on public.copy_versions for all using (public.is_member(team_id)) with check (public.is_member(team_id));
drop policy if exists "copy_comments: teammates"  on public.copy_comments;
drop policy if exists "copy_comments: add own"    on public.copy_comments;
drop policy if exists "copy_comments: edit"       on public.copy_comments;
drop policy if exists "copy_comments: remove own" on public.copy_comments;
create policy "copy_comments: teammates"  on public.copy_comments for select using (public.is_member(team_id));
create policy "copy_comments: add own"    on public.copy_comments for insert with check (public.is_member(team_id) and (author_id is null or author_id = public.my_member_id(team_id)));
create policy "copy_comments: edit"       on public.copy_comments for update using (public.is_member(team_id)) with check (public.is_member(team_id));
create policy "copy_comments: remove own" on public.copy_comments for delete using (author_id = public.my_member_id(team_id) or author_id is null);
drop policy if exists "copy_replies: teammates"  on public.copy_replies;
drop policy if exists "copy_replies: add own"    on public.copy_replies;
drop policy if exists "copy_replies: remove own" on public.copy_replies;
create policy "copy_replies: teammates"  on public.copy_replies for select using (public.is_member(team_id));
create policy "copy_replies: add own"    on public.copy_replies for insert with check (public.is_member(team_id) and (author_id is null or author_id = public.my_member_id(team_id)));
create policy "copy_replies: remove own" on public.copy_replies for delete using (author_id = public.my_member_id(team_id) or author_id is null);

-- a copy version belongs to its page's team, a comment to its version's team, a reply to its comment's team
create or replace function public.check_copy_links() returns trigger
language plpgsql set search_path = public as $$
begin
  if tg_table_name = 'copy_versions' then
    if not exists (select 1 from public.projects p where p.id = new.project_id and p.team_id = new.team_id) then raise exception 'That page is in another team'; end if;
  elsif tg_table_name = 'copy_comments' then
    if not exists (select 1 from public.copy_versions v where v.id = new.copy_version_id and v.team_id = new.team_id) then raise exception 'That copy is in another team'; end if;
  elsif tg_table_name = 'copy_replies' then
    if not exists (select 1 from public.copy_comments c where c.id = new.comment_id and c.team_id = new.team_id) then raise exception 'That comment is in another team'; end if;
  end if;
  return new;
end $$;
drop trigger if exists copy_versions_links on public.copy_versions;
create trigger copy_versions_links before insert or update of project_id, team_id on public.copy_versions for each row execute function public.check_copy_links();
drop trigger if exists copy_comments_links on public.copy_comments;
create trigger copy_comments_links before insert or update of copy_version_id, team_id on public.copy_comments for each row execute function public.check_copy_links();
drop trigger if exists copy_replies_links on public.copy_replies;
create trigger copy_replies_links before insert or update of comment_id, team_id on public.copy_replies for each row execute function public.check_copy_links();

-- guests: a name, a key, and no more than 60 comments and replies in ten minutes on one page, design and copy together
create or replace function public.guest_check(p public.projects, k text, p_name text) returns void
language plpgsql stable security definer set search_path = public as $$
begin
  if k is null then raise exception 'This browser is missing its guest key. Reload the page.'; end if;
  if p_name is null or length(btrim(p_name)) = 0 or length(p_name) > 60 then raise exception 'Add your name first.'; end if;
  if (select count(*) from public.version_comments c join public.versions v on v.id = c.version_id
        where v.project_id = p.id and c.guest_key = k and c.created_at > now() - interval '10 minutes')
   + (select count(*) from public.version_replies r join public.version_comments c on c.id = r.comment_id join public.versions v on v.id = c.version_id
        where v.project_id = p.id and r.guest_key = k and r.created_at > now() - interval '10 minutes')
   + (select count(*) from public.copy_comments c join public.copy_versions v on v.id = c.copy_version_id
        where v.project_id = p.id and c.guest_key = k and c.created_at > now() - interval '10 minutes')
   + (select count(*) from public.copy_replies r join public.copy_comments c on c.id = r.comment_id join public.copy_versions v on v.id = c.copy_version_id
        where v.project_id = p.id and r.guest_key = k and r.created_at > now() - interval '10 minutes') >= 60
  then raise exception 'That is a lot of comments in a short time. Wait a few minutes and try again.'; end if;
end $$;
revoke execute on function public.guest_check(public.projects, text, text) from public, anon, authenticated;

-- the copy version behind a live link, or nothing
create or replace function public.copy_shared_version(p_token text) returns public.copy_versions
language sql stable security definer set search_path = public as $$
  select * from public.copy_versions where p_token ~ '^[A-Za-z0-9_-]{20,64}$' and share_token = p_token and share_on limit 1;
$$;

-- what a guest sees: the page's name, the one copy version, its review-link comments and replies, and who wrote them
create or replace function public.copy_share_open(p_token text, p_key text default null) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare p public.projects; sv public.copy_versions; k text := public.guest_hash(p_key);
begin
  select * into sv from public.copy_shared_version(p_token);
  if sv.id is null then return null; end if;
  select * into p from public.projects where id = sv.project_id;
  return jsonb_build_object(
    'project', jsonb_build_object('id', p.id, 'team_id', p.team_id, 'name', p.name, 'changed_at', p.changed_at,
                                  'team', (select t.name from public.teams t where t.id = p.team_id)),
    'version', jsonb_build_object('id', sv.id, 'n', sv.n, 'body', sv.body, 'src', sv.src, 'created_at', sv.created_at),
    'comments', coalesce((select jsonb_agg(jsonb_build_object('id', c.id, 'n', c.n, 'kind', c.kind, 'at_start', c.at_start, 'at_end', c.at_end,
                  'quote', c.quote, 'body', c.body, 'replacement', c.replacement, 'status', c.status, 'applied_in', c.applied_in,
                  'author_id', c.author_id, 'guest_name', c.guest_name, 'created_at', c.created_at,
                  'mine', (k is not null and c.guest_key = k)) order by c.n)
                from public.copy_comments c where c.copy_version_id = sv.id and c.layer = 'client'), '[]'::jsonb),
    'replies', coalesce((select jsonb_agg(jsonb_build_object('id', r.id, 'comment_id', r.comment_id, 'body', r.body, 'author_id', r.author_id,
                  'guest_name', r.guest_name, 'created_at', r.created_at, 'mine', (k is not null and r.guest_key = k)) order by r.created_at)
                from public.copy_replies r join public.copy_comments c on c.id = r.comment_id
                where c.copy_version_id = sv.id and c.layer = 'client'), '[]'::jsonb),
    'people', coalesce((select jsonb_agg(jsonb_build_object('id', m.id, 'name', m.name, 'photo', m.photo))
                from public.v_members m where m.team_id = p.team_id and (
                  m.id in (select c.author_id from public.copy_comments c where c.copy_version_id = sv.id and c.layer = 'client')
                  or m.id in (select r.author_id from public.copy_replies r join public.copy_comments c on c.id = r.comment_id
                              where c.copy_version_id = sv.id and c.layer = 'client'))), '[]'::jsonb));
end $$;

-- a comment or a suggestion left on the link goes on the linked copy version, in the review-link layer
create or replace function public.copy_share_comment(p_token text, p_key text, p_name text, p_version uuid, p_id uuid, p_kind text,
  p_start integer, p_end integer, p_quote text, p_body text default '', p_rep text default null) returns jsonb
language plpgsql security definer set search_path = public as $$
declare p public.projects; sv public.copy_versions; k text := public.guest_hash(p_key); n_ integer; b text := btrim(coalesce(p_body, ''));
begin
  select * into sv from public.copy_shared_version(p_token);
  if sv.id is null then raise exception 'This link is turned off.'; end if;
  if p_version is distinct from sv.id then raise exception 'That version is not part of this review.'; end if;
  if p_kind not in ('comment', 'suggest') then raise exception 'A comment or a suggestion.'; end if;
  if p_start is null or p_end is null or p_start < 0 or p_end <= p_start or p_end - p_start > 20000 then raise exception 'Select the words first.'; end if;
  if p_quote is null or length(p_quote) = 0 or length(p_quote) > 2000 then raise exception 'Select up to 2000 characters.'; end if;
  if length(b) > 2000 or (p_kind = 'comment' and length(b) = 0) then raise exception 'Comments are 1 to 2000 characters.'; end if;
  if p_kind = 'suggest' and (p_rep is null or length(p_rep) > 5000) then raise exception 'Suggested wording is up to 5000 characters.'; end if;
  select * into p from public.projects where id = sv.project_id;
  perform public.guest_check(p, k, p_name);
  if exists (select 1 from public.copy_comments where id = p_id) then
    return (select jsonb_build_object('id', id, 'n', n) from public.copy_comments where id = p_id and guest_key = k);
  end if;
  select coalesce(max(n), 0) + 1 into n_ from public.copy_comments where copy_version_id = sv.id and layer = 'client';
  insert into public.copy_comments (id, copy_version_id, team_id, n, layer, kind, at_start, at_end, quote, body, replacement, status, author_id, guest_name, guest_key)
  values (p_id, sv.id, p.team_id, n_, 'client', p_kind, p_start, p_end, p_quote, b, case when p_kind = 'suggest' then p_rep end, 'open', null, btrim(p_name), k);
  update public.projects set changed_at = now(), changed_by = null, changed_guest = btrim(p_name) where id = p.id;
  return jsonb_build_object('id', p_id, 'n', n_);
end $$;

-- replies on the link only go on the linked version's review-link comments
create or replace function public.copy_share_reply(p_token text, p_key text, p_name text, p_comment uuid, p_id uuid, p_body text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare p public.projects; sv public.copy_versions; k text := public.guest_hash(p_key);
begin
  select * into sv from public.copy_shared_version(p_token);
  if sv.id is null then raise exception 'This link is turned off.'; end if;
  if not exists (select 1 from public.copy_comments c where c.id = p_comment and c.copy_version_id = sv.id and c.layer = 'client')
    then raise exception 'That comment is not part of this review.'; end if;
  if p_body is null or length(btrim(p_body)) = 0 or length(p_body) > 1000 then raise exception 'Replies are 1 to 1000 characters.'; end if;
  select * into p from public.projects where id = sv.project_id;
  perform public.guest_check(p, k, p_name);
  insert into public.copy_replies (id, comment_id, team_id, author_id, guest_name, guest_key, body)
  values (p_id, p_comment, p.team_id, null, btrim(p_name), k, btrim(p_body)) on conflict (id) do nothing;
  update public.projects set changed_at = now(), changed_by = null, changed_guest = btrim(p_name) where id = p.id;
  return jsonb_build_object('id', p_id);
end $$;

-- a guest removes what they wrote from this browser, on the linked version, nothing else
create or replace function public.copy_share_delete(p_token text, p_key text, p_id uuid) returns boolean
language plpgsql security definer set search_path = public as $$
declare sv public.copy_versions; k text := public.guest_hash(p_key); hit integer;
begin
  select * into sv from public.copy_shared_version(p_token);
  if sv.id is null or k is null then return false; end if;
  delete from public.copy_replies r using public.copy_comments c
    where r.id = p_id and r.guest_key = k and c.id = r.comment_id and c.copy_version_id = sv.id;
  get diagnostics hit = row_count;
  if hit = 0 then
    delete from public.copy_comments c where c.id = p_id and c.guest_key = k and c.copy_version_id = sv.id;
    get diagnostics hit = row_count;
  end if;
  return hit > 0;
end $$;

revoke execute on function public.copy_shared_version(text) from public, anon, authenticated;
revoke execute on function public.copy_share_open(text, text) from public;
revoke execute on function public.copy_share_comment(text, text, text, uuid, uuid, text, integer, integer, text, text, text) from public;
revoke execute on function public.copy_share_reply(text, text, text, uuid, uuid, text) from public;
revoke execute on function public.copy_share_delete(text, text, uuid) from public;
grant execute on function public.copy_share_open(text, text) to anon, authenticated;
grant execute on function public.copy_share_comment(text, text, text, uuid, uuid, text, integer, integer, text, text, text) to anon, authenticated;
grant execute on function public.copy_share_reply(text, text, text, uuid, uuid, text) to anon, authenticated;
grant execute on function public.copy_share_delete(text, text, uuid) to anon, authenticated;

do $$ begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'copy_versions') then
    alter publication supabase_realtime add table public.copy_versions;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'copy_comments') then
    alter publication supabase_realtime add table public.copy_comments;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'copy_replies') then
    alter publication supabase_realtime add table public.copy_replies;
  end if;
end $$;
