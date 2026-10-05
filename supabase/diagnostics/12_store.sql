-- ─────────────────────────────────────────────────────────────────────────────
-- Store: resources, their files and downloads.
-- Read-only. Run these one at a time (select a query, then Run selected).
--
-- A resource doesn't show on /store → status must be 'published'.
-- "Download" says the file is missing → its storage path no longer exists in
--   the store bucket (query 3), or a link points somewhere that's gone.
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Every resource: status, plan, files, size and downloads.
select
  r.title,
  r.slug,
  r.status,
  r.access_plan as needs_plan,
  r.category,
  coalesce(i.name, 'Team') as creator,
  (select count(*) from public.store_files f where f.resource_id = r.id) as files,
  pg_size_pretty((select coalesce(sum(f.size_bytes), 0) from public.store_files f where f.resource_id = r.id)) as total_size,
  r.download_count as public_count,
  coalesce(s.downloads, 0) as all_downloads,
  coalesce(s.last_30_days, 0) as last_30_days,
  r.featured,
  r.is_demo,
  r.published_at
from public.store_resources r
left join public.instructors i on i.id = r.instructor_id
left join public.store_download_stats s on s.resource_id = r.id
order by r.status, r.published_at desc nulls last;

-- 2. Files: where each one lives.
select r.slug, f.position, f.name, f.kind, coalesce(nullif(f.path, ''), f.url) as location, pg_size_pretty(f.size_bytes) as size, f.mime_type
from public.store_files f
join public.store_resources r on r.id = f.resource_id
order by r.slug, f.position;

-- 3. Files whose object is missing from the store bucket.
select r.slug, f.name, f.path
from public.store_files f
join public.store_resources r on r.id = f.resource_id
where f.kind = 'storage'
  and not exists (select 1 from storage.objects o where o.bucket_id = 'store' and o.name = f.path);

-- 4. Latest 50 downloads.
select d.created_at, r.title, coalesce(p.email, '(deleted account)') as who, d.files, d.counted
from public.store_downloads d
join public.store_resources r on r.id = d.resource_id
left join public.profiles p on p.id = d.user_id
order by d.created_at desc
limit 50;
