-- ─────────────────────────────────────────────────────────────────────────────
-- Who is allowed to do what. Read-only. Run each query separately
-- (select it, then Run) or all at once to see the last result.
--
-- "permission denied for table …"   → check query 2 (grants)
-- "new row violates row-level security policy" or empty results
--                                     → check query 1 (policies)
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. RLS policies on our tables and on storage
select
  schemaname || '.' || tablename as "table",
  policyname,
  cmd as action,
  roles,
  qual as "using",
  with_check
from pg_policies
where schemaname = 'public'
   or (schemaname = 'storage' and policyname ilike '%avatar%')
order by 1, cmd, policyname;

-- 2. What signed-in users (role "authenticated") may touch, column by column
select
  table_name,
  privilege_type,
  string_agg(column_name, ', ' order by column_name) as columns
from information_schema.column_privileges
where table_schema = 'public' and grantee = 'authenticated'
group by table_name, privilege_type
order by table_name, privilege_type;

-- 3. RLS on/off for every table in public (all should be true)
select relname as "table", relrowsecurity as rls_enabled
from pg_class
where relnamespace = 'public'::regnamespace and relkind = 'r'
order by relname;
