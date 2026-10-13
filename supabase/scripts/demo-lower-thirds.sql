-- ─────────────────────────────────────────────────────────────────────────────
-- Demo lower thirds: 4 sample resources so /lower-thirds has something to
-- show and test (Free / Resident / Headliner, one file and several).
--
-- They're store resources with the lower-third switch on and no thumbnail,
-- so the site draws its lower-third cover for them. The files are images
-- already in this site's /public folder, so nothing needs uploading. Every
-- row is marked is_demo, and scripts/remove-demo-data.sql deletes them. Add
-- your real lower thirds in Studio → Store (turn on "Lower third").
--
-- Requires migrations 014 and 015. Safe to re-run: existing demo rows are skipped.
-- ─────────────────────────────────────────────────────────────────────────────

with resources (slug, title, category, access_plan, instructor, downloads, days_ago, featured, description) as (
  values
    ('lower-third-name-strap', 'Clean name strap', 'templates', 'warm-up'::public.plan_tier, null, 540, 14, true,
     'A simple white name strap with a green accent bar. Your DJ name on the first line, the venue or genre on the second.'),
    ('lower-third-live-set', 'Live set title card', 'templates', 'warm-up', 'leo-moreno', 315, 9, false,
     'Shows "Live from" with the city and the set''s genre, for the first minutes of a stream.'),
    ('lower-third-social-tags', 'Social handle tags', 'artwork', 'resident', null, 188, 5, false,
     'Instagram, TikTok and YouTube tags that slide in at the top of the frame so viewers can follow you.'),
    ('lower-third-festival-pack', 'Festival screen pack', 'templates', 'headliner', 'amara-okafor', 76, 2, false,
     'Bold name straps and "Up next" cards sized for big LED screens at festivals and club nights.')
),
inserted as (
  insert into public.store_resources (slug, title, description, category, access_plan, instructor_id, status, featured, lower_third, download_count, is_demo, published_at, created_at)
  select r.slug, r.title, 'Sample lower third for testing. ' || r.description, r.category, r.access_plan,
         (select i.id from public.instructors i where i.slug = r.instructor), 'published', r.featured, true, r.downloads, true,
         now() - make_interval(days => r.days_ago), now() - make_interval(days => r.days_ago)
  from resources r
  on conflict (slug) do nothing
  returning id, slug
)
insert into public.store_files (resource_id, name, kind, url, size_bytes, mime_type, position)
select i.id, f.name, 'link', f.url, f.size, f.mime, f.position
from inserted i
join (
  values
    ('lower-third-name-strap', 'name-strap-preview.jpg', '/images/about/graduate-party-set.jpg', 59841, 'image/jpeg', 0),
    ('lower-third-live-set', 'live-set-card.jpg', '/images/courses/festival-sets.jpg', 140555, 'image/jpeg', 0),
    ('lower-third-social-tags', 'social-tags-instagram.jpg', '/images/about/dj-crew-rooftop.jpg', 124803, 'image/jpeg', 0),
    ('lower-third-social-tags', 'social-tags-tiktok.jpg', '/images/about/djs-sharing-decks.jpg', 0, 'image/jpeg', 1),
    ('lower-third-festival-pack', 'festival-name-strap.jpg', '/images/courses/festival-sets.jpg', 140555, 'image/jpeg', 0),
    ('lower-third-festival-pack', 'up-next-card.jpg', '/images/about/graduate-first-residency.jpg', 68488, 'image/jpeg', 1)
) as f (slug, name, url, size, mime, position) on f.slug = i.slug;

-- What's on /lower-thirds now.
select r.title, r.access_plan, r.download_count, count(f.id) as files, r.is_demo
from public.store_resources r
left join public.store_files f on f.resource_id = r.id
where r.lower_third
group by r.id
order by r.published_at desc;
