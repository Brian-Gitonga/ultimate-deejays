-- ─────────────────────────────────────────────────────────────────────────────
-- 008 · Site settings and the media library
--
-- site_settings  one row (id = 'site') holding Studio → Settings as JSON:
--                general, plans, pricing, blog, payments, affiliates, notifications.
--                The pricing page and affiliate program read it. Anyone can read
--                it (nothing in it is secret); only admins can change it.
-- media bucket   uploads from Studio → Media library and the image pickers
--                (course covers, blog covers, challenge images, instructor photos).
-- media_assets   one row per upload, so the library can list, label and delete them.
--
-- Requires 001. Safe to re-run. The settings row itself is seeded by 011.
-- ─────────────────────────────────────────────────────────────────────────────

-- Settings ──────────────────────────────────────────────────────────────────

create table if not exists public.site_settings (
  id         text primary key default 'site' check (id = 'site'),
  data       jsonb not null default '{}' check (jsonb_typeof(data) = 'object'),
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles (id) on delete set null
);

comment on table public.site_settings is 'Studio → Settings. Exactly one row, id = ''site''.';

create or replace function public.site_settings_stamp()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  new.updated_by := coalesce((select auth.uid()), new.updated_by);
  return new;
end;
$$;

drop trigger if exists site_settings_stamp on public.site_settings;
create trigger site_settings_stamp
  before insert or update on public.site_settings
  for each row execute function public.site_settings_stamp();

alter table public.site_settings enable row level security;

drop policy if exists "Anyone can read settings" on public.site_settings;
create policy "Anyone can read settings"
  on public.site_settings for select to anon, authenticated
  using (true);

drop policy if exists "Admins change settings" on public.site_settings;
create policy "Admins change settings"
  on public.site_settings for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

revoke all on table public.site_settings from anon, authenticated;
grant select on table public.site_settings to anon, authenticated;
grant insert, update on table public.site_settings to authenticated;

-- Media bucket ──────────────────────────────────────────────────────────────
-- Public URLs, 10 MB per file. SVG isn't allowed: it can carry scripts.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', true, 10485760, array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Admins list media files" on storage.objects;
create policy "Admins list media files"
  on storage.objects for select to authenticated
  using (bucket_id = 'media' and (select public.is_admin()));

drop policy if exists "Admins upload media files" on storage.objects;
create policy "Admins upload media files"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'media' and (select public.is_admin()));

drop policy if exists "Admins replace media files" on storage.objects;
create policy "Admins replace media files"
  on storage.objects for update to authenticated
  using (bucket_id = 'media' and (select public.is_admin()));

drop policy if exists "Admins delete media files" on storage.objects;
create policy "Admins delete media files"
  on storage.objects for delete to authenticated
  using (bucket_id = 'media' and (select public.is_admin()));

-- Media library ─────────────────────────────────────────────────────────────

create table if not exists public.media_assets (
  id          uuid primary key default gen_random_uuid(),
  path        text not null unique check (char_length(path) <= 300),
  url         text not null,
  name        text not null default '' check (char_length(name) <= 200),
  alt         text not null default '' check (char_length(alt) <= 300),
  folder      text not null default 'general' check (folder in ('general', 'courses', 'blog', 'challenges', 'instructors', 'resources')),
  mime_type   text not null default '',
  size_bytes  bigint not null default 0 check (size_bytes >= 0),
  width       integer,
  height      integer,
  uploaded_by uuid references public.profiles (id) on delete set null default auth.uid(),
  created_at  timestamptz not null default now()
);

comment on table public.media_assets is 'Every file in the media bucket. path = the object''s path inside the bucket.';
comment on column public.media_assets.alt is 'Describes the image for screen readers.';

create index if not exists media_assets_recent_idx on public.media_assets (created_at desc);

alter table public.media_assets enable row level security;

drop policy if exists "Admins manage media" on public.media_assets;
create policy "Admins manage media"
  on public.media_assets for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

revoke all on table public.media_assets from anon, authenticated;
grant select, insert, delete on table public.media_assets to authenticated;
grant update (name, alt, folder) on table public.media_assets to authenticated;
