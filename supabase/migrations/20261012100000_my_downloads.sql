-- ─────────────────────────────────────────────────────────────────────────────
-- 017 · A member's own downloads, for Account → Overview
--
-- my_downloads(max_rows)  the templates the signed-in member downloaded most
--                         recently, newest first, one row per template with
--                         when they last took it.
--
-- store_downloads stays readable by admins only; this hands members their own
-- rows and nothing else.
--
-- Run after 016. Safe to run again.
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function public.my_downloads(max_rows integer default 12)
returns table (resource_id uuid, last_at timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  select d.resource_id, max(d.created_at) as last_at
  from public.store_downloads d
  where d.user_id = (select auth.uid())
  group by d.resource_id
  order by last_at desc
  limit least(greatest(coalesce(max_rows, 12), 1), 50);
$$;

comment on function public.my_downloads(integer) is 'The signed-in member''s most recently downloaded store resources (Account → Overview).';

revoke all on function public.my_downloads(integer) from public, anon;
grant execute on function public.my_downloads(integer) to authenticated;
