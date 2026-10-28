-- Noon: client links per version. A link opens one version of a project and nothing else: that page, the comments
-- left on the link, and room to add more. The project-wide link is retired (none had been made); its columns stay so
-- older code keeps loading, but no token on projects opens anything any more. Files are readable through a link only
-- when they belong to a version whose link is on. Safe to run more than once.

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
