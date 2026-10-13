-- ─────────────────────────────────────────────────────────────────────────────
-- Content: courses, blog posts and lower thirds at a glance. Read-only.
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

-- 3. Lower thirds (store resources with the lower-third switch on, listed on /lower-thirds)
select
  r.status,
  r.title,
  '/lower-thirds/' || r.slug as page,
  r.access_plan as who_can_download,
  r.download_count as downloads,
  (select count(*) from public.store_files f where f.resource_id = r.id) as files,
  r.published_at
from public.store_resources r
where r.lower_third
order by r.published_at desc nulls first;
