-- ─────────────────────────────────────────────────────────────────────────────
-- 018 · Preview videos for store resources
--
-- store_resources.preview_video  a short clip uploaded in Studio → Store. It
--                                plays when someone rests the mouse on the
--                                cover in /store and /lower-thirds, and is the
--                                featured video on the resource's page.
--
-- The value is where the file lives, like store file paths:
-- "r2:resources/<id>/…" in Cloudflare R2, or "resources/<id>/…" in the
-- Supabase store bucket. Both are private: the site plays it through
-- /api/store/preview/<slug>, which hands out a signed link.
--
-- Run after 017. Safe to run again.
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.store_resources add column if not exists preview_video text not null default '';

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'store_resources_preview_video_check') then
    alter table public.store_resources
      add constraint store_resources_preview_video_check check (char_length(preview_video) <= 500);
  end if;
end $$;

comment on column public.store_resources.preview_video is 'Path of the hover/featured preview clip (r2:… or a store bucket path), or empty.';

-- Admins set it from Studio (the row policies already limit writes to admins).
grant insert (preview_video) on table public.store_resources to authenticated;
grant update (preview_video) on table public.store_resources to authenticated;
