-- Noon: a meeting can carry a place or a link, and a kind (meet, plan, review) that sets its colour.
alter table public.events add column if not exists location text;
alter table public.events add column if not exists kind text check (kind is null or kind in ('meet','plan','review'));
