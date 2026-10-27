-- Noon: comment layers. Every comment belongs to one layer: 'team' (the app, never shown on a client link) or 'client'
-- (the conversation on the project's client link). Anyone on the link sees only the client layer, and whatever is
-- left on the link lands in it, whoever leaves it. The team sees both layers in the app, kept apart. Replies follow
-- their comment's layer. Numbers count per layer (team #1, #2 …; client C1, C2 …). Safe to run more than once.

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
