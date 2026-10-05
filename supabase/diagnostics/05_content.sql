-- ─────────────────────────────────────────────────────────────────────────────
-- Content: courses, blog posts and challenges at a glance. Read-only.
-- Run each query on its own (select it, then Run), or all for the last one.
--
-- A published course with 0 lessons shows an empty player on the site.
-- A post only appears on the site once it's not a draft AND publish_at has passed.
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Courses with their instructor, curriculum size and figures shown on the site
select
  c.status,
  c.title,
  c.slug,
  i.name as instructor,
  c.access_plan,
  (select count(*) from public.course_sections s where s.course_id = c.id) as sections,
  (select count(*) from public.course_lessons l where l.course_id = c.id) as lessons,
  c.duration_minutes,
  c.sample_students + c.enrolled_count as students_shown,
  c.enrolled_count as real_students,
  case when c.sample_reviews + c.review_count = 0 then 0
       else round((c.sample_rating * c.sample_reviews + c.rating_total) / (c.sample_reviews + c.review_count), 1) end as rating_shown,
  c.updated_at
from public.courses c
left join public.instructors i on i.id = c.instructor_id
order by c.status, c.title;

-- 2. Blog posts: is each one live on the site right now?
select
  case when p.status <> 'draft' and p.publish_at <= now() then 'live'
       when p.status = 'scheduled' then 'scheduled'
       else 'draft' end as on_site,
  p.title,
  p.slug,
  p.category,
  i.name as author,
  p.publish_at,
  char_length(p.body) as body_chars,
  p.updated_at
from public.blog_posts p
left join public.instructors i on i.id = p.author_id
order by p.publish_at desc;

-- 3. Challenges with their state and entries
select
  case when not c.published then 'draft'
       when current_date < c.opens then 'upcoming'
       when current_date > c.closes then 'ended'
       else 'live' end as state,
  c.title,
  c.slug,
  c.opens,
  c.closes,
  c.entry_count as real_entries,
  c.sample_entries + c.entry_count as entries_shown,
  jsonb_array_length(coalesce(c.winners, '[]')) as winners
from public.challenges c
order by c.opens desc;
