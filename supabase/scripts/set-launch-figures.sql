-- ─────────────────────────────────────────────────────────────────────────────
-- Launch figures: your real contact details, and numbers that fit a site
-- that is one month old. Run once; safe to re-run.
--
-- 1. Contact (shown in the footer, and the phone is the WhatsApp chat link):
--      Phone / WhatsApp   +254 114 669 532      (0114 669 532)
--      Location           Wangige, Kiambu County
-- 2. Students shown on the home page, About page and sign-up: 90
--    (also editable any time in Studio → Settings → General).
-- 3. Per-course "students": a few per paid course, more on the free one.
--    Real sign-ups add to these automatically.
-- 4. Course ratings and review counts go to 0. Reviews come only from real
--    students (Account → course page); until then a course shows "New"
--    instead of a made-up star rating.
-- 5. Challenge entry counts go to 0 (real entries count themselves).
--
-- Edit the numbers below to match reality before you run it. The
-- placeholders are yours to change: nothing else on the site depends on them.
-- To show only real figures from now on, use scripts/clear-sample-figures.sql.
-- ─────────────────────────────────────────────────────────────────────────────

update public.site_settings
set data = jsonb_set(
             data,
             '{general}',
             coalesce(data -> 'general', '{}'::jsonb) || jsonb_build_object(
               'phone', '+254 114 669 532',
               'address', 'Wangige, Kiambu County',
               'studentCount', 90
             )
           )
where id = 'site'
returning data -> 'general' ->> 'phone' as phone, data -> 'general' ->> 'address' as location, data -> 'general' ->> 'studentCount' as students;

update public.courses c
set sample_students = v.students,
    sample_rating = 0,
    sample_reviews = 0
from (
  values
    ('dj-fundamentals', 52),
    ('afrobeats-amapiano-mixing', 6),
    ('serato-dj-pro-masterclass', 5),
    ('controller-djing', 4),
    ('ableton-production-for-djs', 3),
    ('rekordbox-cdj-club-ready', 3),
    ('harmonic-mixing', 2),
    ('scratch-school', 2),
    ('house-techno-mixing', 2),
    ('open-format-djing', 2),
    ('first-club-gig', 1),
    ('vinyl-djing-essentials', 1),
    ('reading-the-crowd', 1),
    ('wedding-event-dj', 0),
    ('festival-sets', 0),
    ('radio-mixshow-dj', 0)
) as v (slug, students)
where c.slug = v.slug;

-- Any other course (added later) also starts without made-up ratings.
update public.courses set sample_rating = 0, sample_reviews = 0 where sample_rating > 0 or sample_reviews > 0;

update public.challenges set sample_entries = 0 where sample_entries > 0;

-- What the site shows now.
select slug, access_plan as plan, sample_students + enrolled_count as students, sample_reviews + review_count as reviews
from public.courses
where status = 'published'
order by sample_students + enrolled_count desc, slug;
