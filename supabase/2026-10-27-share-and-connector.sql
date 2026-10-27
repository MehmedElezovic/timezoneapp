-- Noon: client links and the Claude connector.
-- A project can have a share link. Whoever opens it sees that one project (every version and its comments) and can
-- comment as a guest: they type a name, nothing else. Guests never touch the tables directly; they go through the
-- share_* functions below, which check the link on every call. The files are readable while the link is on.
-- The Claude connector signs in with a personal key made in Settings; only its hash is stored here.
-- Safe to run more than once.

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
