-- ─────────────────────────────────────────────────────────────────────────────
-- 010 · Admin views and notifications
--
-- Read-only views that roll data up for the studio. They're
-- security_invoker views: whoever queries them only sees the rows RLS already
-- lets them see, so admins see everything and nobody else sees anything extra.
--
-- student_overview     one row per student with their totals (Studio → Students)
-- enrollment_progress  each enrollment with lessons done / total
-- affiliate_overview   each affiliate with clicks, sign-ups, sales, earnings
-- admin_activity       a feed of everything that happened (Studio → Notifications)
-- admin_notification_state  when each admin last read that feed (the bell's count)
--
-- Requires 001–009. Safe to re-run.
-- ─────────────────────────────────────────────────────────────────────────────

create or replace view public.student_overview with (security_invoker = true) as
select
  p.id,
  p.full_name,
  p.dj_name,
  p.email,
  p.avatar_url,
  p.location,
  p.plan,
  p.status,
  p.created_at,
  p.last_seen_at,
  p.updated_at,
  p.referred_by,
  (select count(*) from public.challenge_entries e where e.user_id = p.id)::int as challenge_entries,
  (select count(*) from public.mix_submissions m where m.user_id = p.id)::int as mixes_submitted,
  (select coalesce(sum(pay.amount), 0) from public.payments pay where pay.user_id = p.id and pay.status = 'paid')::numeric(10, 2) as paid
from public.profiles p
where p.role = 'user';

create or replace view public.enrollment_progress with (security_invoker = true) as
select
  e.user_id,
  e.course_id,
  c.slug as course_slug,
  c.title as course_title,
  e.source,
  e.enrolled_at,
  e.last_lesson_at,
  (select count(*) from public.course_lessons l where l.course_id = e.course_id)::int as lessons_total,
  (select count(*)
     from public.lesson_progress lp
     join public.course_lessons l on l.course_id = lp.course_id and l.slug = lp.lesson_slug
    where lp.user_id = e.user_id and lp.course_id = e.course_id)::int as lessons_done
from public.enrollments e
join public.courses c on c.id = e.course_id;

create or replace view public.affiliate_overview with (security_invoker = true) as
select
  a.user_id as id,
  coalesce(nullif(p.dj_name, ''), nullif(p.full_name, ''), p.email) as name,
  p.email,
  p.avatar_url,
  a.channel,
  a.channel_url,
  a.audience,
  a.pitch,
  a.status,
  a.code,
  a.commission,
  a.note,
  a.applied_at,
  a.approved_at,
  a.updated_at,
  (select count(*) from public.referral_clicks rc where rc.affiliate_id = a.user_id)::int as clicks,
  (select count(*) from public.profiles r where r.referred_by = a.user_id)::int as signups,
  (select count(*) from public.payments pay where pay.affiliate_id = a.user_id and pay.status = 'paid')::int as sales,
  (select coalesce(sum(pay.amount), 0) from public.payments pay where pay.affiliate_id = a.user_id and pay.status = 'paid')::numeric(10, 2) as revenue,
  (select coalesce(sum(pay.commission), 0) from public.payments pay where pay.affiliate_id = a.user_id and pay.status = 'paid')::numeric(10, 2) as earned,
  (select coalesce(sum(ap.amount), 0) from public.affiliate_payouts ap where ap.affiliate_id = a.user_id)::numeric(10, 2) as paid_out
from public.affiliate_applications a
join public.profiles p on p.id = a.user_id;

-- Activity feed ─────────────────────────────────────────────────────────────

create or replace view public.admin_activity with (security_invoker = true) as
select 'student:' || p.id as id, 'student' as kind,
       coalesce(nullif(p.full_name, ''), p.email) || ' created an account' as title,
       p.email as detail, '/studio/students?q=' || p.email as href, p.created_at as created_at
from public.profiles p where p.role = 'user'
union all
select 'affiliate:' || a.user_id, 'affiliate',
       coalesce(nullif(p.dj_name, ''), nullif(p.full_name, ''), p.email) || ' applied to the affiliate program',
       a.channel || ' · ' || a.channel_url, '/studio/affiliates', a.applied_at
from public.affiliate_applications a join public.profiles p on p.id = a.user_id
union all
select 'payment:' || pay.id, 'payment',
       coalesce(nullif(pay.customer_name, ''), pay.customer_email) || ' bought ' || initcap(replace(pay.plan::text, '-', ' ')),
       pay.currency || ' ' || pay.amount::text, '/studio/earnings', pay.paid_at
from public.payments pay
union all
select 'refund:' || pay.id, 'refund',
       'Refunded ' || coalesce(nullif(pay.customer_name, ''), pay.customer_email),
       pay.currency || ' ' || pay.amount::text, '/studio/earnings', pay.refunded_at
from public.payments pay where pay.refunded_at is not null
union all
select 'entry:' || e.id, 'entry', e.name || ' entered ' || c.title,
       'youtu.be/' || e.youtube_id, '/studio/challenges/' || c.id || '/edit#entries', e.created_at
from public.challenge_entries e join public.challenges c on c.id = e.challenge_id
union all
select 'review:' || r.id, 'review', r.reviewer_name || ' rated ' || c.title || ' ' || r.rating || '/5',
       left(r.body, 140), '/studio/reviews', r.created_at
from public.course_reviews r join public.courses c on c.id = r.course_id
union all
select 'mix:' || m.id, 'mix', m.submitter_name || ' sent a mix for feedback',
       m.title, '/studio/feedback', m.created_at
from public.mix_submissions m;

create table if not exists public.admin_notification_state (
  admin_id     uuid primary key references public.profiles (id) on delete cascade default auth.uid(),
  last_read_at timestamptz not null default now()
);

alter table public.admin_notification_state enable row level security;

drop policy if exists "Admins track their own read state" on public.admin_notification_state;
create policy "Admins track their own read state"
  on public.admin_notification_state for all to authenticated
  using (admin_id = (select auth.uid()) and (select public.is_admin()))
  with check (admin_id = (select auth.uid()) and (select public.is_admin()));

revoke all on table public.admin_notification_state from anon, authenticated;
grant select, insert, update on table public.admin_notification_state to authenticated;

-- Views: signed-in users only (RLS inside decides what they see).
revoke all on public.student_overview, public.enrollment_progress, public.affiliate_overview, public.admin_activity from anon, authenticated;
grant select on public.student_overview, public.enrollment_progress, public.affiliate_overview, public.admin_activity to authenticated;
