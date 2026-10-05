-- ─────────────────────────────────────────────────────────────────────────────
-- Students: plans, activity and course progress. Read-only.
-- Run each query on its own (select it, then Run), or all for the last one.
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Every student with their totals (what Studio → Students shows)
select
  s.email,
  coalesce(nullif(s.dj_name, ''), s.full_name) as name,
  s.plan,
  s.status,
  (select count(*) from public.enrollments e where e.user_id = s.id) as courses,
  s.challenge_entries,
  s.mixes_submitted,
  s.paid,
  s.created_at as joined,
  s.last_seen_at as last_active
from public.student_overview s
order by s.created_at desc;

-- 2. Course progress per student
select
  p.email,
  ep.course_title,
  ep.lessons_done || ' / ' || ep.lessons_total as lessons,
  case when ep.lessons_total = 0 then 0 else round(100.0 * least(ep.lessons_done, ep.lessons_total) / ep.lessons_total) end as percent,
  ep.source,
  ep.enrolled_at,
  ep.last_lesson_at
from public.enrollment_progress ep
join public.profiles p on p.id = ep.user_id
order by ep.last_lesson_at desc nulls last, ep.enrolled_at desc;

-- 3. Reviews and mixes waiting on you
select 'review' as kind, r.reviewer_name as who, c.title as about, r.rating::text as detail, r.status, r.created_at
from public.course_reviews r join public.courses c on c.id = r.course_id
where r.reply = ''
union all
select 'mix', m.submitter_name, m.title, m.link, m.status, m.created_at
from public.mix_submissions m
where m.status = 'pending'
order by created_at desc;
