-- ─────────────────────────────────────────────────────────────────────────────
-- Demo store: 8 sample resources so /store has something to show and test
-- (single downloads, ZIPs of several files, Free / Resident / Headliner).
--
-- The files are images and logos already in this site's /public folder, so
-- nothing needs uploading. Every row is marked is_demo, and
-- scripts/remove-demo-data.sql deletes them. Add your real resources in
-- Studio → Store.
--
-- Requires migration 014. Safe to re-run: existing demo resources are skipped.
-- ─────────────────────────────────────────────────────────────────────────────

with resources (slug, title, category, access_plan, instructor, thumbnail, downloads, days_ago, featured, description) as (
  values
    ('brand-logo-kit', 'Ultimate Deejays logo kit', 'artwork', 'warm-up'::public.plan_tier, null, '/images/about/dj-crew-rooftop.jpg', 1240, 40, true,
     'Our logo in colour and white, plus the record mark. Use it on flyers, stream overlays and your press kit when you promote a set you learned with us.'),
    ('social-post-templates', 'Social post templates', 'templates', 'warm-up', null, '/images/blog/dj-press-kit.jpg', 860, 26, false,
     'Square post, story and link-preview layouts sized for Instagram, TikTok, Facebook and newsletters. Drop in your own photo and set details.'),
    ('website-banner-set', 'Website banner set', 'templates', 'resident', null, '/images/blog/land-your-first-club-booking.jpg', 312, 18, false,
     'Leaderboard, rectangle and skyscraper banners for your DJ website or blog sidebar.'),
    ('course-cover-wallpapers', 'Course cover wallpapers', 'artwork', 'warm-up', 'leo-moreno', '/images/courses/festival-sets.jpg', 2310, 60, false,
     'Six high-resolution course covers for your desktop, phone or stream background.'),
    ('press-photo-pack', 'Press photo pack', 'templates', 'headliner', 'amara-okafor', '/images/about/graduate-party-set.jpg', 148, 9, false,
     'Three photos from our graduate showcase to show promoters what a professional DJ press shot looks like.'),
    ('practice-routine-sheet', '20-minute practice routine', 'cue-sheets', 'warm-up', 'marcus-reid', '/images/blog/practice-in-20-minutes-a-day.jpg', 3950, 75, true,
     'Print it and stick it next to your decks: warm-up, beatmatching drill, EQ swap and a recorded mix, in 20 minutes a day.'),
    ('camelot-wheel-reference', 'Camelot wheel reference', 'cue-sheets', 'resident', 'mei-tanaka', '/images/blog/harmonic-mixing-camelot-wheel.jpg', 1475, 33, false,
     'A quick reference for harmonic mixing: move one step around the wheel, or jump between inner and outer rings for an energy change.'),
    ('wedding-gig-checklist', 'Wedding gig checklist', 'cue-sheets', 'warm-up', 'daniel-mensah', '/images/blog/wedding-dj-checklist.jpg', 690, 12, false,
     'Everything to confirm with the couple and the venue before a wedding booking, from the first-dance track to the power supply.')
),
inserted as (
  insert into public.store_resources (slug, title, description, category, thumbnail, access_plan, instructor_id, status, featured, download_count, is_demo, published_at, created_at)
  select r.slug, r.title, 'Sample item for testing the store. ' || r.description, r.category, r.thumbnail, r.access_plan,
         (select i.id from public.instructors i where i.slug = r.instructor), 'published', r.featured, r.downloads, true,
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
    ('brand-logo-kit', 'ultimate-deejays-logo.svg', '/affiliate/logos/logo.svg', 637, 'image/svg+xml', 0),
    ('brand-logo-kit', 'ultimate-deejays-logo-white.svg', '/affiliate/logos/logo-white.svg', 637, 'image/svg+xml', 1),
    ('brand-logo-kit', 'record-mark.svg', '/affiliate/logos/mark.svg', 330, 'image/svg+xml', 2),
    ('social-post-templates', 'square-post-1080.svg', '/affiliate/banners/social-square-1080.svg', 3618, 'image/svg+xml', 0),
    ('social-post-templates', 'story-1080x1920.svg', '/affiliate/banners/story-1080x1920.svg', 3862, 'image/svg+xml', 1),
    ('social-post-templates', 'link-preview-1200x628.svg', '/affiliate/banners/link-preview-1200x628.svg', 3433, 'image/svg+xml', 2),
    ('website-banner-set', 'leaderboard-728x90.svg', '/affiliate/banners/leaderboard-728x90.svg', 2970, 'image/svg+xml', 0),
    ('website-banner-set', 'rectangle-300x250.svg', '/affiliate/banners/rectangle-300x250.svg', 3399, 'image/svg+xml', 1),
    ('website-banner-set', 'skyscraper-160x600.svg', '/affiliate/banners/skyscraper-160x600.svg', 4022, 'image/svg+xml', 2),
    ('course-cover-wallpapers', 'dj-fundamentals.jpg', '/images/courses/dj-fundamentals.jpg', 84750, 'image/jpeg', 0),
    ('course-cover-wallpapers', 'festival-sets.jpg', '/images/courses/festival-sets.jpg', 140555, 'image/jpeg', 1),
    ('course-cover-wallpapers', 'house-techno-mixing.jpg', '/images/courses/house-techno-mixing.jpg', 71845, 'image/jpeg', 2),
    ('course-cover-wallpapers', 'scratch-school.jpg', '/images/courses/scratch-school.jpg', 55889, 'image/jpeg', 3),
    ('course-cover-wallpapers', 'vinyl-djing-essentials.jpg', '/images/courses/vinyl-djing-essentials.jpg', 37511, 'image/jpeg', 4),
    ('course-cover-wallpapers', 'afrobeats-amapiano-mixing.jpg', '/images/courses/afrobeats-amapiano-mixing.jpg', 79013, 'image/jpeg', 5),
    ('press-photo-pack', 'showcase-party-set.jpg', '/images/about/graduate-party-set.jpg', 59841, 'image/jpeg', 0),
    ('press-photo-pack', 'crew-rooftop.jpg', '/images/about/dj-crew-rooftop.jpg', 124803, 'image/jpeg', 1),
    ('press-photo-pack', 'first-residency.jpg', '/images/about/graduate-first-residency.jpg', 68488, 'image/jpeg', 2),
    ('practice-routine-sheet', 'practice-routine.jpg', '/images/blog/practice-in-20-minutes-a-day.jpg', 150068, 'image/jpeg', 0),
    ('camelot-wheel-reference', 'camelot-wheel.jpg', '/images/blog/harmonic-mixing-camelot-wheel.jpg', 95312, 'image/jpeg', 0),
    ('wedding-gig-checklist', 'wedding-checklist.jpg', '/images/blog/wedding-dj-checklist.jpg', 168642, 'image/jpeg', 0)
) as f (slug, name, url, size, mime, position) on f.slug = i.slug;

-- What's there now.
select r.title, r.access_plan, r.download_count, count(f.id) as files, r.is_demo
from public.store_resources r
left join public.store_files f on f.resource_id = r.id
group by r.id
order by r.published_at desc;
