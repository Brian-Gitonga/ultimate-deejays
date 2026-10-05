-- ─────────────────────────────────────────────────────────────────────────────
-- Uploaded files. Read-only. Run each query on its own, or all for the last one.
-- 1. Profile photos, newest first, with whose they are.
-- Each user should have at most one file: older ones are deleted on upload.
-- ─────────────────────────────────────────────────────────────────────────────

select
  p.email as owner,
  o.name as path,
  round((o.metadata ->> 'size')::numeric / 1024, 1) as size_kb,
  o.metadata ->> 'mimetype' as type,
  o.created_at,
  p.avatar_url like '%' || o.name as is_current_photo
from storage.objects o
left join public.profiles p on p.id::text = (storage.foldername(o.name))[1]
where o.bucket_id = 'avatars'
order by o.created_at desc;

-- Media library: files uploaded in the studio, newest first.
-- in_library = false means the file is in storage but the media_assets row is missing.
select
  o.name as path,
  round((o.metadata ->> 'size')::numeric / 1024, 1) as size_kb,
  o.metadata ->> 'mimetype' as type,
  o.created_at,
  exists (select 1 from public.media_assets a where a.path = o.name) as in_library
from storage.objects o
where o.bucket_id = 'media'
order by o.created_at desc;
