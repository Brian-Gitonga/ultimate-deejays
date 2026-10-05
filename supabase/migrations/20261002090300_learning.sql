-- ─────────────────────────────────────────────────────────────────────────────
-- 007 · Students: plans, enrollments, progress, reviews and mix feedback
--
-- profiles (new columns)  plan, status (active / suspended), last_seen_at,
--                         referred_by (the affiliate who brought them, see 009)
-- enrollments             a student started a course
-- lesson_progress         lessons a student has finished
-- course_reviews          star ratings and reviews (Studio → Reviews)
-- mix_submissions         mixes sent for feedback (Studio → Mix feedback)
--
-- Students can't change their own plan or status, can only review courses
-- they're enrolled in, and can send as many mixes as their plan allows
-- (Warm-Up 0, Resident 2, Headliner unlimited).
--
-- Requires 001 and 004. Safe to re-run.
-- ─────────────────────────────────────────────────────────────────────────────

-- Profiles: plan, status, activity, referral ────────────────────────────────

alter table public.profiles add column if not exists plan public.plan_tier not null default 'warm-up';
alter table public.profiles add column if not exists status text not null default 'active';
alter table public.profiles add column if not exists last_seen_at timestamptz;
alter table public.profiles add column if not exists referred_by uuid references public.profiles (id) on delete set null;
alter table public.profiles add column if not exists referred_at timestamptz;

do $$ begin
  alter table public.profiles add constraint profiles_status_check check (status in ('active', 'suspended'));
exception when duplicate_object then null;
end $$;

comment on column public.profiles.plan is 'Highest plan bought (or granted by an admin). Decides which courses and features they get.';
comment on column public.profiles.status is 'suspended = can''t log in.';
comment on column public.profiles.referred_by is 'The affiliate whose link they signed up through.';

create index if not exists profiles_referred_by_idx on public.profiles (referred_by) where referred_by is not null;

drop policy if exists "Admins can update any profile" on public.profiles;
create policy "Admins can update any profile"
  on public.profiles for update
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

grant update (plan, status) on table public.profiles to authenticated;

-- Only admins may change plan or status; everyone else gets an error, even on their own row.
-- (The SQL editor and the service role aren't "authenticated", so they're not affected.)
create or replace function public.profiles_guard()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_user in ('authenticated', 'anon') and not public.is_admin()
     and (new.plan is distinct from old.plan or new.status is distinct from old.status) then
    raise exception 'Only admins can change a plan or account status.' using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_guard on public.profiles;
create trigger profiles_guard
  before update on public.profiles
  for each row execute function public.profiles_guard();

-- Called by the app on page loads (at most every 10 minutes) for "Last active".
create or replace function public.touch_last_seen()
returns void
language sql
security definer
set search_path = ''
as $$
  update public.profiles
  set last_seen_at = now()
  where id = (select auth.uid())
    and (last_seen_at is null or last_seen_at < now() - interval '10 minutes');
$$;

revoke execute on function public.touch_last_seen() from public, anon;
grant execute on function public.touch_last_seen() to authenticated;

-- Enrollments ───────────────────────────────────────────────────────────────

create table if not exists public.enrollments (
  user_id        uuid not null references public.profiles (id) on delete cascade,
  course_id      uuid not null references public.courses (id) on delete cascade,
  source         text not null default 'self' check (source in ('self', 'admin', 'purchase')),
  enrolled_at    timestamptz not null default now(),
  last_lesson_at timestamptz,
  primary key (user_id, course_id)
);

comment on table public.enrollments is 'A student started a course (made automatically when they open it signed in).';

create index if not exists enrollments_course_idx on public.enrollments (course_id);
create index if not exists enrollments_recent_idx on public.enrollments (enrolled_at desc);

-- Lesson progress ───────────────────────────────────────────────────────────

create table if not exists public.lesson_progress (
  user_id      uuid not null references public.profiles (id) on delete cascade,
  course_id    uuid not null references public.courses (id) on delete cascade,
  lesson_slug  text not null check (char_length(lesson_slug) <= 100),
  completed_at timestamptz not null default now(),
  primary key (user_id, course_id, lesson_slug)
);

create index if not exists lesson_progress_course_idx on public.lesson_progress (course_id);

-- Reviews ───────────────────────────────────────────────────────────────────

create table if not exists public.course_reviews (
  id              uuid primary key default gen_random_uuid(),
  course_id       uuid not null references public.courses (id) on delete cascade,
  user_id         uuid references public.profiles (id) on delete cascade,
  reviewer_name   text not null default '' check (char_length(reviewer_name) <= 80),
  reviewer_avatar text,
  rating          smallint not null check (rating between 1 and 5),
  body            text not null default '' check (char_length(body) <= 2000),
  status          text not null default 'published' check (status in ('published', 'hidden')),
  reply           text not null default '' check (char_length(reply) <= 2000),
  replied_at      timestamptz,
  is_demo         boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  check (user_id is not null or is_demo)
);

comment on table public.course_reviews is 'Course reviews. hidden = removed from the site by an admin.';
comment on column public.course_reviews.reviewer_name is 'Copied from the profile when written, so the site can show it without exposing profiles.';

create unique index if not exists course_reviews_one_per_student on public.course_reviews (course_id, user_id) where user_id is not null;
create index if not exists course_reviews_course_idx on public.course_reviews (course_id, created_at desc);

drop trigger if exists course_reviews_set_updated_at on public.course_reviews;
create trigger course_reviews_set_updated_at
  before update on public.course_reviews
  for each row execute function public.set_updated_at();

-- Course counters: courses.enrolled_count, review_count, rating_total ──────
-- SECURITY DEFINER because students can't update courses themselves.

create or replace function public.refresh_course_counts(target uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.courses c set
    enrolled_count = (select count(*) from public.enrollments e where e.course_id = c.id),
    review_count   = (select count(*) from public.course_reviews r where r.course_id = c.id and r.status = 'published'),
    rating_total   = (select coalesce(sum(r.rating), 0) from public.course_reviews r where r.course_id = c.id and r.status = 'published')
  where c.id = target;
$$;

revoke execute on function public.refresh_course_counts(uuid) from public, anon, authenticated;

create or replace function public.enrollments_after_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.refresh_course_counts(coalesce(new.course_id, old.course_id));
  return null;
end;
$$;

revoke execute on function public.enrollments_after_change() from public, anon, authenticated;

-- Name/photo snapshot on insert; reply time on reply; only admins moderate.
-- Runs as the caller (not SECURITY DEFINER) so current_user tells students
-- apart from admins and the SQL editor. Students can read their own profile.
create or replace function public.course_reviews_before_write()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  is_member boolean := current_user in ('authenticated', 'anon');
begin
  if tg_op = 'INSERT' then
    if new.user_id is not null then
      select coalesce(nullif(p.dj_name, ''), nullif(p.full_name, ''), 'Student'), p.avatar_url
      into new.reviewer_name, new.reviewer_avatar
      from public.profiles p where p.id = new.user_id;
    end if;
    if is_member and not public.is_admin() then
      new.status := 'published';
      new.reply := '';
      new.replied_at := null;
    end if;
  else
    if is_member and not public.is_admin()
       and (new.status is distinct from old.status or new.reply is distinct from old.reply) then
      raise exception 'Only admins can hide or reply to reviews.' using errcode = '42501';
    end if;
    if new.reply is distinct from old.reply then
      new.replied_at := case when new.reply = '' then null else now() end;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists course_reviews_before_write on public.course_reviews;
create trigger course_reviews_before_write
  before insert or update on public.course_reviews
  for each row execute function public.course_reviews_before_write();

create or replace function public.course_reviews_after_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.refresh_course_counts(coalesce(new.course_id, old.course_id));
  if tg_op = 'UPDATE' and new.course_id is distinct from old.course_id then
    perform public.refresh_course_counts(old.course_id);
  end if;
  return null;
end;
$$;

revoke execute on function public.course_reviews_after_change() from public, anon, authenticated;

drop trigger if exists course_reviews_after_change on public.course_reviews;
create trigger course_reviews_after_change
  after insert or update or delete on public.course_reviews
  for each row execute function public.course_reviews_after_change();

drop trigger if exists enrollments_after_change on public.enrollments;
create trigger enrollments_after_change
  after insert or delete on public.enrollments
  for each row execute function public.enrollments_after_change();

-- Progress bumps the enrollment's "last lesson" time.
create or replace function public.lesson_progress_touch_enrollment()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.enrollments set last_lesson_at = now()
  where user_id = new.user_id and course_id = new.course_id;
  return null;
end;
$$;

revoke execute on function public.lesson_progress_touch_enrollment() from public, anon, authenticated;

drop trigger if exists lesson_progress_touch_enrollment on public.lesson_progress;
create trigger lesson_progress_touch_enrollment
  after insert on public.lesson_progress
  for each row execute function public.lesson_progress_touch_enrollment();

-- Is the signed-in user enrolled in this course?
create or replace function public.is_enrolled(target uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.enrollments where user_id = (select auth.uid()) and course_id = target);
$$;

-- Mix submissions ───────────────────────────────────────────────────────────

create table if not exists public.mix_submissions (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid references public.profiles (id) on delete cascade,
  submitter_name text not null default '' check (char_length(submitter_name) <= 80),
  title          text not null check (char_length(title) between 2 and 120),
  link           text not null check (link ~ '^https?://' and char_length(link) <= 500),
  course_id      uuid references public.courses (id) on delete set null,
  notes          text not null default '' check (char_length(notes) <= 1000),
  status         text not null default 'pending' check (status in ('pending', 'reviewed')),
  feedback       text not null default '' check (char_length(feedback) <= 5000),
  reviewed_by    uuid references public.profiles (id) on delete set null,
  reviewed_at    timestamptz,
  is_demo        boolean not null default false,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  check (user_id is not null or is_demo)
);

comment on table public.mix_submissions is 'Mixes students send for instructor feedback.';
comment on column public.mix_submissions.notes is 'What the student wants feedback on.';

create index if not exists mix_submissions_status_idx on public.mix_submissions (status, created_at desc);
create index if not exists mix_submissions_user_idx on public.mix_submissions (user_id);

drop trigger if exists mix_submissions_set_updated_at on public.mix_submissions;
create trigger mix_submissions_set_updated_at
  before update on public.mix_submissions
  for each row execute function public.set_updated_at();

-- How many more mixes the signed-in user can send. NULL = unlimited.
create or replace function public.mix_quota_left()
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select case p.plan
           when 'headliner' then null
           when 'resident' then greatest(2 - (select count(*) from public.mix_submissions m where m.user_id = p.id), 0)::int
           else 0
         end
  from public.profiles p
  where p.id = (select auth.uid());
$$;

create or replace function public.mix_submissions_before_write()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    if new.user_id is not null then
      select coalesce(nullif(p.dj_name, ''), nullif(p.full_name, ''), p.email) into new.submitter_name
      from public.profiles p where p.id = new.user_id;
    end if;
  elsif new.feedback is distinct from old.feedback then
    new.status := case when new.feedback = '' then 'pending' else 'reviewed' end;
    new.reviewed_at := case when new.feedback = '' then null else now() end;
    new.reviewed_by := case when new.feedback = '' then null else coalesce((select auth.uid()), old.reviewed_by) end;
  end if;
  return new;
end;
$$;

drop trigger if exists mix_submissions_before_write on public.mix_submissions;
create trigger mix_submissions_before_write
  before insert or update on public.mix_submissions
  for each row execute function public.mix_submissions_before_write();

-- Row Level Security ────────────────────────────────────────────────────────

alter table public.enrollments enable row level security;
alter table public.lesson_progress enable row level security;
alter table public.course_reviews enable row level security;
alter table public.mix_submissions enable row level security;

-- Enrollments: students see and start their own; admins see and manage all.
drop policy if exists "Students see their enrollments" on public.enrollments;
create policy "Students see their enrollments"
  on public.enrollments for select to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists "Students enroll themselves in published courses" on public.enrollments;
create policy "Students enroll themselves in published courses"
  on public.enrollments for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and source = 'self'
    and exists (select 1 from public.courses c where c.id = course_id and c.status = 'published')
  );

drop policy if exists "Admins manage enrollments" on public.enrollments;
create policy "Admins manage enrollments"
  on public.enrollments for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- Progress: students manage their own (in courses they're enrolled in).
drop policy if exists "Students see their progress" on public.lesson_progress;
create policy "Students see their progress"
  on public.lesson_progress for select to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists "Students record their progress" on public.lesson_progress;
create policy "Students record their progress"
  on public.lesson_progress for insert to authenticated
  with check (user_id = (select auth.uid()) and public.is_enrolled(course_id));

drop policy if exists "Students undo their progress" on public.lesson_progress;
create policy "Students undo their progress"
  on public.lesson_progress for delete to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists "Admins see all progress" on public.lesson_progress;
create policy "Admins see all progress"
  on public.lesson_progress for select to authenticated
  using ((select public.is_admin()));

-- Reviews: published ones are public; students write one per course they're enrolled in.
drop policy if exists "Anyone can read published reviews" on public.course_reviews;
create policy "Anyone can read published reviews"
  on public.course_reviews for select to anon, authenticated
  using (status = 'published');

drop policy if exists "Students see their own reviews" on public.course_reviews;
create policy "Students see their own reviews"
  on public.course_reviews for select to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists "Enrolled students write a review" on public.course_reviews;
create policy "Enrolled students write a review"
  on public.course_reviews for insert to authenticated
  with check (user_id = (select auth.uid()) and public.is_enrolled(course_id));

drop policy if exists "Students edit their review" on public.course_reviews;
create policy "Students edit their review"
  on public.course_reviews for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists "Students delete their review" on public.course_reviews;
create policy "Students delete their review"
  on public.course_reviews for delete to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists "Admins manage reviews" on public.course_reviews;
create policy "Admins manage reviews"
  on public.course_reviews for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- Mixes: students send (within their plan's quota) and read their own; admins review.
drop policy if exists "Students see their mixes" on public.mix_submissions;
create policy "Students see their mixes"
  on public.mix_submissions for select to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists "Students send mixes within their plan" on public.mix_submissions;
create policy "Students send mixes within their plan"
  on public.mix_submissions for insert to authenticated
  with check (user_id = (select auth.uid()) and coalesce(public.mix_quota_left() > 0, true));

drop policy if exists "Students withdraw pending mixes" on public.mix_submissions;
create policy "Students withdraw pending mixes"
  on public.mix_submissions for delete to authenticated
  using (user_id = (select auth.uid()) and status = 'pending');

drop policy if exists "Admins manage mixes" on public.mix_submissions;
create policy "Admins manage mixes"
  on public.mix_submissions for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- Privileges ────────────────────────────────────────────────────────────────

revoke all on table public.enrollments, public.lesson_progress, public.course_reviews, public.mix_submissions from anon, authenticated;

grant select, delete on table public.enrollments to authenticated;
grant insert (user_id, course_id, source) on table public.enrollments to authenticated;

grant select, delete on table public.lesson_progress to authenticated;
grant insert (user_id, course_id, lesson_slug) on table public.lesson_progress to authenticated;

grant select on table public.course_reviews to anon, authenticated;
grant insert (course_id, user_id, rating, body) on table public.course_reviews to authenticated;
grant update (rating, body, status, reply) on table public.course_reviews to authenticated;
grant delete on table public.course_reviews to authenticated;

grant select, delete on table public.mix_submissions to authenticated;
grant insert (user_id, title, link, course_id, notes) on table public.mix_submissions to authenticated;
grant update (feedback) on table public.mix_submissions to authenticated;
