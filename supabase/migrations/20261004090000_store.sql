-- ─────────────────────────────────────────────────────────────────────────────
-- 014 · Store: downloadable resources
--
-- store_resources  what /store lists: practice tracks, sample packs, stems,
--                  cue sheets, presets, templates, artwork… Each has a plan
--                  (warm-up = free with an account), a creator (an instructor,
--                  or the team when empty), a thumbnail and a download count.
-- store_files      the files inside a resource, in order: a file in the
--                  private "store" bucket, or a link (Google Drive, Dropbox,
--                  or a file on this site). Where a file lives is never public.
-- store_downloads  every download (Studio → Store shows the totals).
-- store_download() checks sign-in, the plan and that the resource is
--                  published, records the download and hands out the files.
--                  The site's download route then streams them (or a ZIP).
--
-- Download counts: each person counts once per resource per day, so
-- re-downloading or double-clicking doesn't inflate them. Admins don't count.
--
-- Requires 001–013. Safe to re-run.
-- ─────────────────────────────────────────────────────────────────────────────

-- Resources ─────────────────────────────────────────────────────────────────

create table if not exists public.store_resources (
  id             uuid primary key default gen_random_uuid(),
  slug           text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 100),
  title          text not null check (char_length(title) between 1 and 120),
  description    text not null default '' check (char_length(description) <= 5000),
  category       text not null default 'other' check (category ~ '^[a-z0-9-]{1,40}$'),
  thumbnail      text not null default '' check (char_length(thumbnail) <= 500),
  preview_url    text not null default '' check (char_length(preview_url) <= 300),
  access_plan    public.plan_tier not null default 'warm-up',
  instructor_id  uuid references public.instructors (id) on delete set null,
  status         text not null default 'draft' check (status in ('draft', 'published')),
  featured       boolean not null default false,
  download_count integer not null default 0 check (download_count >= 0),
  is_demo        boolean not null default false,
  published_at   timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

comment on table public.store_resources is 'Downloads on /store. access_plan = the lowest plan that can download it (warm-up = free with an account).';
comment on column public.store_resources.preview_url is 'Optional YouTube link shown on the resource page instead of the thumbnail.';
comment on column public.store_resources.download_count is 'People who downloaded it (once per person per day). Kept by store_download().';

create index if not exists store_resources_status_idx on public.store_resources (status, published_at desc);

-- Downloads don't count as an edit, so they leave updated_at alone.
drop trigger if exists store_resources_set_updated_at on public.store_resources;
create trigger store_resources_set_updated_at
  before update on public.store_resources
  for each row
  when (old.download_count = new.download_count)
  execute function public.set_updated_at();

create or replace function public.store_resources_stamp_published()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status = 'published' and new.published_at is null then
    new.published_at := now();
  end if;
  return new;
end;
$$;

drop trigger if exists store_resources_stamp_published on public.store_resources;
create trigger store_resources_stamp_published
  before insert or update of status on public.store_resources
  for each row execute function public.store_resources_stamp_published();

-- Files ─────────────────────────────────────────────────────────────────────

create table if not exists public.store_files (
  id          uuid primary key default gen_random_uuid(),
  resource_id uuid not null references public.store_resources (id) on delete cascade,
  name        text not null check (char_length(name) between 1 and 200),
  kind        text not null check (kind in ('storage', 'link')),
  path        text not null default '' check (char_length(path) <= 500),
  url         text not null default '' check (char_length(url) <= 1000),
  size_bytes  bigint not null default 0 check (size_bytes >= 0),
  mime_type   text not null default '' check (char_length(mime_type) <= 120),
  position    integer not null default 0,
  created_at  timestamptz not null default now(),
  check ((kind = 'storage' and path <> '') or (kind = 'link' and url ~ '^(https?://|/[^/])'))
);

comment on table public.store_files is 'Files inside a store resource. path (store bucket) and url (links) are only handed out by store_download().';

create index if not exists store_files_resource_idx on public.store_files (resource_id, position);

-- Downloads ─────────────────────────────────────────────────────────────────

create table if not exists public.store_downloads (
  id          bigint generated always as identity primary key,
  resource_id uuid not null references public.store_resources (id) on delete cascade,
  user_id     uuid references public.profiles (id) on delete set null,
  files       integer not null default 1 check (files >= 1),
  counted     boolean not null default true,
  created_at  timestamptz not null default now()
);

comment on column public.store_downloads.counted is 'Whether it added to the public count (once per person per resource per day).';

create index if not exists store_downloads_resource_idx on public.store_downloads (resource_id, created_at desc);
create index if not exists store_downloads_user_idx on public.store_downloads (user_id, resource_id, created_at desc);

-- store_download(resource, files) ───────────────────────────────────────────
-- Returns { status: "ok", slug, title, files: [{ id, name, kind, path, url,
-- size, mime }] } or { status: "signin" | "upgrade" | "not_found", plan }.
-- file_ids picks some of the files; null = all of them.

create or replace function public.store_download(resource_slug text, file_ids uuid[] default null)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := (select auth.uid());
  v_resource record;
  v_profile record;
  v_files jsonb;
  v_counted boolean;
begin
  select r.id, r.slug, r.title, r.access_plan into v_resource
  from public.store_resources r
  where r.slug = resource_slug and r.status = 'published';
  if v_resource.id is null then
    return jsonb_build_object('status', 'not_found');
  end if;

  if v_user is null then
    return jsonb_build_object('status', 'signin');
  end if;

  select p.plan, p.role, p.status into v_profile from public.profiles p where p.id = v_user;
  if v_profile.status is null or v_profile.status = 'suspended' then
    return jsonb_build_object('status', 'signin');
  end if;

  if v_profile.role <> 'admin' and v_profile.plan < v_resource.access_plan then
    return jsonb_build_object('status', 'upgrade', 'plan', v_resource.access_plan);
  end if;

  select coalesce(jsonb_agg(jsonb_build_object(
           'id', f.id, 'name', f.name, 'kind', f.kind, 'path', f.path, 'url', f.url, 'size', f.size_bytes, 'mime', f.mime_type
         ) order by f.position, f.created_at), '[]'::jsonb)
  into v_files
  from public.store_files f
  where f.resource_id = v_resource.id and (file_ids is null or f.id = any (file_ids));

  if jsonb_array_length(v_files) = 0 then
    return jsonb_build_object('status', 'not_found');
  end if;

  -- Admins checking a pack aren't counted.
  if v_profile.role <> 'admin' then
    v_counted := not exists (
      select 1 from public.store_downloads d
      where d.resource_id = v_resource.id and d.user_id = v_user and d.created_at > now() - interval '1 day'
    );
    insert into public.store_downloads (resource_id, user_id, files, counted)
    values (v_resource.id, v_user, jsonb_array_length(v_files), v_counted);
    if v_counted then
      update public.store_resources set download_count = download_count + 1 where id = v_resource.id;
    end if;
  end if;

  return jsonb_build_object('status', 'ok', 'slug', v_resource.slug, 'title', v_resource.title, 'files', v_files);
end;
$$;

revoke execute on function public.store_download(text, uuid[]) from public;
grant execute on function public.store_download(text, uuid[]) to anon, authenticated;

-- The studio's editor reads where each file lives through this.
create or replace function public.studio_store_files(target uuid default null)
returns table (id uuid, resource_id uuid, name text, kind text, path text, url text, size_bytes bigint, mime_type text, "position" integer)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Only admins can see store files.' using errcode = '42501';
  end if;
  return query
    select f.id, f.resource_id, f.name, f.kind, f.path, f.url, f.size_bytes, f.mime_type, f.position
    from public.store_files f
    where target is null or f.resource_id = target
    order by f.resource_id, f.position, f.created_at;
end;
$$;

revoke execute on function public.studio_store_files(uuid) from public, anon;
grant execute on function public.studio_store_files(uuid) to authenticated;

-- Studio: downloads per resource ────────────────────────────────────────────

create or replace view public.store_download_stats with (security_invoker = true) as
select
  d.resource_id,
  count(*)::int as downloads,
  count(*) filter (where d.created_at > now() - interval '30 days')::int as last_30_days,
  count(distinct d.user_id)::int as people,
  max(d.created_at) as last_download_at
from public.store_downloads d
group by d.resource_id;

-- Row Level Security ────────────────────────────────────────────────────────

alter table public.store_resources enable row level security;
alter table public.store_files enable row level security;
alter table public.store_downloads enable row level security;

drop policy if exists "Anyone can see published resources" on public.store_resources;
create policy "Anyone can see published resources"
  on public.store_resources for select to anon, authenticated
  using (status = 'published');

drop policy if exists "Admins manage resources" on public.store_resources;
create policy "Admins manage resources"
  on public.store_resources for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

drop policy if exists "Anyone can see files of published resources" on public.store_files;
create policy "Anyone can see files of published resources"
  on public.store_files for select to anon, authenticated
  using (exists (select 1 from public.store_resources r where r.id = resource_id and r.status = 'published'));

drop policy if exists "Admins manage store files" on public.store_files;
create policy "Admins manage store files"
  on public.store_files for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

drop policy if exists "Admins see downloads" on public.store_downloads;
create policy "Admins see downloads"
  on public.store_downloads for select to authenticated
  using ((select public.is_admin()));

-- Privileges ────────────────────────────────────────────────────────────────
-- Visitors see each file's name, type and size, never where it lives.

revoke all on table public.store_resources, public.store_files, public.store_downloads from anon, authenticated;
revoke all on public.store_download_stats from anon, authenticated;

grant select on table public.store_resources to anon, authenticated;
grant insert (id, slug, title, description, category, thumbnail, preview_url, access_plan, instructor_id, status, featured)
  on table public.store_resources to authenticated;
grant update (slug, title, description, category, thumbnail, preview_url, access_plan, instructor_id, status, featured)
  on table public.store_resources to authenticated;
grant delete on table public.store_resources to authenticated;

grant select (id, resource_id, name, kind, size_bytes, mime_type, position, created_at) on table public.store_files to anon, authenticated;
grant insert (id, resource_id, name, kind, path, url, size_bytes, mime_type, position) on table public.store_files to authenticated;
grant update (name, kind, path, url, size_bytes, mime_type, position) on table public.store_files to authenticated;
grant delete on table public.store_files to authenticated;

grant select on table public.store_downloads to authenticated;
grant select on public.store_download_stats to authenticated;

-- The store bucket (private) ───────────────────────────────────────────────
-- Admins upload from Studio → Store. Nobody else reads it directly: the
-- download route signs a short-lived link after store_download() says yes.
-- No size limit here: the project's limit applies (50 MB per file on
-- Supabase's free plan; Storage settings on paid plans).

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('store', 'store', false, null, null)
on conflict (id) do update set public = false;

drop policy if exists "Admins list store files" on storage.objects;
create policy "Admins list store files"
  on storage.objects for select to authenticated
  using (bucket_id = 'store' and (select public.is_admin()));

drop policy if exists "Admins upload store files" on storage.objects;
create policy "Admins upload store files"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'store' and (select public.is_admin()));

drop policy if exists "Admins replace store files" on storage.objects;
create policy "Admins replace store files"
  on storage.objects for update to authenticated
  using (bucket_id = 'store' and (select public.is_admin()));

drop policy if exists "Admins delete store files" on storage.objects;
create policy "Admins delete store files"
  on storage.objects for delete to authenticated
  using (bucket_id = 'store' and (select public.is_admin()));

-- Store thumbnails get their own folder in the media library ────────────────

alter table public.media_assets drop constraint if exists media_assets_folder_check;
alter table public.media_assets add constraint media_assets_folder_check
  check (folder in ('general', 'courses', 'blog', 'challenges', 'instructors', 'resources', 'store'));
