-- ─────────────────────────────────────────────────────────────────────────────
-- 019 · Lower thirds in the /lower-thirds hero
--
-- store_resources.hero_featured  shows a lower third in the carousel at the
--                                top of /lower-thirds, where its preview
--                                video plays on its own (its thumbnail shows
--                                until the video has loaded). Switched on in
--                                Studio → Store, on lower thirds only.
--
-- Run after 018. Safe to run again.
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.store_resources add column if not exists hero_featured boolean not null default false;

comment on column public.store_resources.hero_featured is 'Shown in the /lower-thirds hero carousel (lower thirds only).';

create index if not exists store_resources_hero_idx on public.store_resources (published_at desc) where hero_featured and lower_third and status = 'published';

-- Admins set it from Studio (the row policies already limit writes to admins).
grant insert (hero_featured) on table public.store_resources to authenticated;
grant update (hero_featured) on table public.store_resources to authenticated;
