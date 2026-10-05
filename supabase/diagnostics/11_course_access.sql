-- ─────────────────────────────────────────────────────────────────────────────
-- Course access: who can watch what, and where students are.
-- Read-only. Run these one at a time (select a query, then Run selected).
--
-- A student sees "Unlock this lesson" when their plan is below the course's
-- plan and the lesson isn't a free preview. Plans: warm-up < resident < headliner.
-- Change a student's plan in Studio → Students (or scripts/set-student-plan.sql).
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Each course: the plan it needs, its free-preview lessons, and how many students opened it.
select
  c.title,
  c.status,
  c.access_plan as needs_plan,
  (select count(*) from public.course_lessons l where l.course_id = c.id) as lessons,
  (select count(*) from public.course_lessons l where l.course_id = c.id and l.preview) as free_previews,
  (select count(*) from public.course_lessons l where l.course_id = c.id and l.youtube = '') as lessons_without_video,
  (select count(*) from public.enrollments e where e.course_id = c.id) as students
from public.courses c
order by c.status, c.access_plan, c.title;

-- 2. One student's courses: edit the email. Shows their plan, what they've opened and where they stopped.
select
  p.email,
  p.plan,
  p.status as account_status,
  c.title,
  c.access_plan as needs_plan,
  p.plan >= c.access_plan as included,
  e.enrolled_at,
  e.last_lesson_slug,
  e.last_lesson_at,
  (select count(*) from public.lesson_progress lp where lp.user_id = p.id and lp.course_id = c.id) as lessons_done
from public.profiles p
join public.enrollments e on e.user_id = p.id
join public.courses c on c.id = e.course_id
where p.email = lower('student@example.com')
order by e.last_lesson_at desc nulls last;

-- 3. Who can read lesson videos directly (should be nobody but the owner and service role).
select grantee, privilege_type
from information_schema.column_privileges
where table_schema = 'public' and table_name = 'course_lessons' and column_name = 'youtube'
order by grantee;

-- 4. Newsletter: subscribers in the last 30 days and in total.
select
  count(*) filter (where unsubscribed_at is null) as subscribed,
  count(*) filter (where unsubscribed_at is null and created_at > now() - interval '30 days') as new_last_30_days,
  count(*) filter (where unsubscribed_at is not null) as unsubscribed
from public.newsletter_subscribers;
