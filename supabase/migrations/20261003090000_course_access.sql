-- ─────────────────────────────────────────────────────────────────────────────
-- 012 · Course access, learning tracking, challenge rules and the newsletter
--
-- Courses: anyone can browse a course page, but lesson videos are only handed
-- out to signed-in students whose plan includes the course (free-preview
-- lessons are open to every signed-in student). The YouTube links and lesson
-- downloads are no longer readable directly; the site asks lesson_video(),
-- which checks the plan, enrolls the student and remembers where they are.
--
-- Plans (lowest to highest): warm-up < resident < headliner. A course's
-- access_plan is the lowest plan that includes it.
--
-- Challenges: entries now need an account. Warm-Up members can enter
-- Beginner challenges; Resident and Headliner members can enter all.
--
-- Newsletter: sign-ups from the site's newsletter form (Studio → Subscribers).
--
-- Requires 001–011. Safe to re-run.
-- ─────────────────────────────────────────────────────────────────────────────

-- Lesson videos and downloads: no longer public columns ──────────────────────

revoke select on table public.course_lessons from anon, authenticated;
grant select (course_id, id, section_id, slug, title, summary, duration_seconds, preview, source, position)
  on table public.course_lessons to anon, authenticated;

comment on column public.course_lessons.youtube is 'Only handed out by lesson_video() to students whose plan includes the course.';

-- save_course() writes the video columns, which admins can no longer read
-- directly, so it now runs with the owner's rights. It still refuses anyone
-- who isn't an admin (first line of the function).
alter function public.save_course(jsonb) security definer;

-- The studio's course editor reads the videos and downloads through this.
create or replace function public.studio_lesson_media(target uuid default null)
returns table (course_id uuid, id text, youtube text, resources jsonb)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Only admins can see lesson videos.' using errcode = '42501';
  end if;
  return query
    select l.course_id, l.id, l.youtube, l.resources
    from public.course_lessons l
    where target is null or l.course_id = target;
end;
$$;

revoke execute on function public.studio_lesson_media(uuid) from public, anon;
grant execute on function public.studio_lesson_media(uuid) to authenticated;

-- Where each student is in a course.
alter table public.enrollments add column if not exists last_lesson_slug text;

-- lesson_video(course, lesson) ───────────────────────────────────────────────
-- Returns { status: "ok", youtube, resources, full } or { status: "signin" |
-- "upgrade" | "not_found", plan }. full = the student's plan includes the
-- course (not just this free preview). With full access the student is
-- enrolled (the first time) and the lesson is remembered for "Continue where
-- you left off". Enrolling happens only here (or in the studio), so progress
-- and reviews always belong to students who can take the course.

drop policy if exists "Students enroll themselves in published courses" on public.enrollments;

create or replace function public.lesson_video(course_slug text, lesson_slug text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := (select auth.uid());
  v_course_id uuid;
  v_access public.plan_tier;
  v_lesson record;
  v_profile record;
  v_full boolean;
begin
  select c.id, c.access_plan into v_course_id, v_access
  from public.courses c
  where c.slug = course_slug and c.status = 'published';
  if v_course_id is null then
    return jsonb_build_object('status', 'not_found');
  end if;

  select l.slug, l.youtube, l.resources, l.preview into v_lesson
  from public.course_lessons l
  where l.course_id = v_course_id and l.slug = lesson_slug;
  if v_lesson.slug is null then
    return jsonb_build_object('status', 'not_found');
  end if;

  if v_user is null then
    return jsonb_build_object('status', 'signin');
  end if;

  select p.plan, p.role, p.status into v_profile from public.profiles p where p.id = v_user;
  if v_profile.status is null or v_profile.status = 'suspended' then
    return jsonb_build_object('status', 'signin');
  end if;

  v_full := v_profile.role = 'admin' or v_profile.plan >= v_access;
  if not v_full and not v_lesson.preview then
    return jsonb_build_object('status', 'upgrade', 'plan', v_access);
  end if;

  -- Admins previewing courses aren't counted as students.
  if v_full and v_profile.role <> 'admin' then
    insert into public.enrollments (user_id, course_id, source)
    values (v_user, v_course_id, 'self')
    on conflict (user_id, course_id) do nothing;

    update public.enrollments
    set last_lesson_slug = v_lesson.slug, last_lesson_at = now()
    where user_id = v_user and course_id = v_course_id;
  end if;

  return jsonb_build_object('status', 'ok', 'youtube', v_lesson.youtube, 'resources', v_lesson.resources, 'full', v_full, 'plan', v_access);
end;
$$;

revoke execute on function public.lesson_video(text, text) from public;
grant execute on function public.lesson_video(text, text) to anon, authenticated;

-- Challenge entries need an account ───────────────────────────────────────────

-- Warm-Up: Beginner challenges only. Resident and Headliner: every challenge.
create or replace function public.can_enter_challenge(target uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.challenges c, public.profiles p
    where c.id = target
      and p.id = (select auth.uid())
      and p.status = 'active'
      and (c.difficulty = 'Beginner' or p.plan >= 'resident' or p.role = 'admin')
  );
$$;

drop policy if exists "Anyone can enter an open challenge" on public.challenge_entries;
drop policy if exists "Members enter open challenges their plan allows" on public.challenge_entries;
create policy "Members enter open challenges their plan allows"
  on public.challenge_entries for insert
  to authenticated
  with check (
    user_id = (select auth.uid())
    and public.challenge_is_open(challenge_id)
    and public.can_enter_challenge(challenge_id)
  );

revoke insert on table public.challenge_entries from anon;

create unique index if not exists challenge_entries_one_per_member
  on public.challenge_entries (challenge_id, user_id) where user_id is not null;

-- Email preferences (Account → Settings → Email notifications) ────────────────

alter table public.profiles
  add column if not exists email_prefs jsonb not null
  default '{"new-courses": true, "challenges": true, "feedback": true, "newsletter": false}'::jsonb;

do $$ begin
  alter table public.profiles add constraint profiles_email_prefs_check check (jsonb_typeof(email_prefs) = 'object');
exception when duplicate_object then null;
end $$;

grant update (email_prefs) on table public.profiles to authenticated;

-- Newsletter subscribers ─────────────────────────────────────────────────────
-- Written by the site (secret key) after checking the address, so there's no
-- public insert. Admins read and remove them in Studio → Subscribers.

create table if not exists public.newsletter_subscribers (
  id              uuid primary key default gen_random_uuid(),
  email           text not null check (char_length(email) between 3 and 254),
  user_id         uuid references public.profiles (id) on delete set null,
  source          text not null default 'website' check (char_length(source) <= 60),
  created_at      timestamptz not null default now(),
  unsubscribed_at timestamptz
);

create unique index if not exists newsletter_subscribers_email_key on public.newsletter_subscribers (lower(email));

alter table public.newsletter_subscribers enable row level security;

drop policy if exists "Admins manage subscribers" on public.newsletter_subscribers;
create policy "Admins manage subscribers"
  on public.newsletter_subscribers for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

revoke all on table public.newsletter_subscribers from anon, authenticated;
grant select, delete on table public.newsletter_subscribers to authenticated;
grant update (unsubscribed_at) on table public.newsletter_subscribers to authenticated;
