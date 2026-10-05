-- ─────────────────────────────────────────────────────────────────────────────
-- Before launch: stop showing the placeholder figures.
--
-- Courses show sample students, ratings and reviews, and challenges show
-- sample entry counts, on top of the real ones. This sets the samples to 0,
-- so the site shows only real numbers from then on. Content is not changed.
-- ─────────────────────────────────────────────────────────────────────────────

update public.courses set sample_students = 0, sample_rating = 0, sample_reviews = 0
where sample_students > 0 or sample_reviews > 0
returning slug, enrolled_count as real_students, review_count as real_reviews;

update public.challenges set sample_entries = 0
where sample_entries > 0
returning slug, entry_count as real_entries;
