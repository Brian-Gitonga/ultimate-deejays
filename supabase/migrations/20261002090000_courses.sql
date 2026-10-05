-- ─────────────────────────────────────────────────────────────────────────────
-- 004 · Instructors, courses and curricula
--
-- instructors       the people who teach courses and write blog posts
-- courses           one row per course (Studio → Courses)
-- course_sections   the course's sections, in order
-- course_lessons    lessons inside sections, in order (YouTube links)
--
-- Anyone can read published courses and their lessons; only admins can see
-- drafts or change anything. The studio saves a whole course at once through
-- public.save_course(), so the course, its sections and its lessons are always
-- saved together or not at all.
--
-- The sample_* columns hold the placeholder figures the site shows today
-- (students, rating, reviews). Real enrollments and reviews are added on top.
-- Clear them before launch with scripts/clear-sample-figures.sql.
--
-- Requires 001. Safe to re-run.
-- ─────────────────────────────────────────────────────────────────────────────

do $$ begin
  create type public.plan_tier as enum ('warm-up', 'resident', 'headliner');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.course_status as enum ('draft', 'review', 'published');
exception when duplicate_object then null;
end $$;

-- Instructors ───────────────────────────────────────────────────────────────

create table if not exists public.instructors (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 80),
  name          text not null check (char_length(name) between 2 and 80),
  specialty     text not null default '' check (char_length(specialty) <= 80),
  bio           text not null default '' check (char_length(bio) <= 1000),
  image         text not null default '',
  email         text not null default '' check (char_length(email) <= 254),
  position      integer not null default 0,
  show_on_about boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

comment on table public.instructors is 'Course teachers and blog authors. Shown on course pages, the About page and blog posts.';

drop trigger if exists instructors_set_updated_at on public.instructors;
create trigger instructors_set_updated_at
  before update on public.instructors
  for each row execute function public.set_updated_at();

-- Courses ───────────────────────────────────────────────────────────────────

create table if not exists public.courses (
  id               uuid primary key default gen_random_uuid(),
  slug             text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 80),
  title            text not null default '' check (char_length(title) <= 120),
  subtitle         text not null default '' check (char_length(subtitle) <= 300),
  description      text not null default '' check (char_length(description) <= 20000),
  category         text not null default '',
  subcategory      text not null default '',
  level            text not null default 'Beginner' check (level in ('Beginner', 'Intermediate', 'Advanced', 'All Levels')),
  language         text not null default 'English',
  access_plan      public.plan_tier not null default 'resident',
  thumbnail        text not null default '',
  promo_video      text not null default '',
  outcomes         text[] not null default '{}',
  requirements     text[] not null default '{}',
  audience         text[] not null default '{}',
  drip             boolean not null default false,
  status           public.course_status not null default 'draft',
  instructor_id    uuid references public.instructors (id) on delete set null,
  duration_minutes integer not null default 0 check (duration_minutes >= 0),
  -- Kept up to date by triggers in 007 (enrollments, reviews):
  enrolled_count   integer not null default 0,
  review_count     integer not null default 0,
  rating_total     integer not null default 0,
  -- Placeholder figures (see the header):
  sample_students  integer not null default 0 check (sample_students >= 0),
  sample_rating    numeric(2, 1) not null default 0 check (sample_rating between 0 and 5),
  sample_reviews   integer not null default 0 check (sample_reviews >= 0),
  published_at     timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

comment on table public.courses is 'Courses. status = published shows them on the site.';
comment on column public.courses.duration_minutes is 'Total lesson length, recalculated by save_course().';
comment on column public.courses.published_at is 'First time the course was published. Used for "Newest" sorting.';

create index if not exists courses_status_idx on public.courses (status);
create index if not exists courses_instructor_idx on public.courses (instructor_id);

drop trigger if exists courses_set_updated_at on public.courses;
create trigger courses_set_updated_at
  before update on public.courses
  for each row execute function public.set_updated_at();

-- Stamp published_at the first time a course goes live.
create or replace function public.courses_stamp_published()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status = 'published' and new.published_at is null then
    new.published_at := now();
  end if;
  return new;
end;
$$;

drop trigger if exists courses_stamp_published on public.courses;
create trigger courses_stamp_published
  before insert or update of status on public.courses
  for each row execute function public.courses_stamp_published();

-- Curriculum ────────────────────────────────────────────────────────────────
-- Section and lesson ids are short text ids made by the studio editor, unique
-- within a course. Lesson slugs appear in URLs (?lesson=) and in progress
-- records, so they're kept stable once created.

create table if not exists public.course_sections (
  course_id uuid not null references public.courses (id) on delete cascade,
  id        text not null check (char_length(id) between 1 and 120),
  title     text not null default '' check (char_length(title) <= 120),
  position  integer not null default 0,
  primary key (course_id, id)
);

create table if not exists public.course_lessons (
  course_id        uuid not null references public.courses (id) on delete cascade,
  id               text not null check (char_length(id) between 1 and 120),
  section_id       text not null,
  slug             text not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 100),
  title            text not null default '' check (char_length(title) <= 150),
  summary          text not null default '' check (char_length(summary) <= 2000),
  youtube          text not null default '' check (char_length(youtube) <= 300),
  duration_seconds integer not null default 0 check (duration_seconds >= 0),
  preview          boolean not null default false,
  resources        jsonb not null default '[]' check (jsonb_typeof(resources) = 'array'),
  source           text not null default '' check (char_length(source) <= 120),
  position         integer not null default 0,
  primary key (course_id, id),
  foreign key (course_id, section_id) references public.course_sections (course_id, id) on delete cascade
);

-- Deferred, so two lessons can trade slugs within one save.
do $$ begin
  alter table public.course_lessons
    add constraint course_lessons_slug_key unique (course_id, slug) deferrable initially deferred;
exception when duplicate_object or duplicate_table then null;
end $$;

comment on column public.course_lessons.resources is 'Downloads for the lesson: [{ "id", "label", "url" }].';
comment on column public.course_lessons.source is 'Channel credit for videos you didn''t make.';

-- save_course(payload) ──────────────────────────────────────────────────────
-- Inserts or updates a course with its whole curriculum in one transaction.
-- payload: the studio's course record (see lib/db/courses.ts → toSavePayload).
-- Sections and lessons missing from the payload are deleted.

create or replace function public.save_course(payload jsonb)
returns uuid
language plpgsql
security definer -- admins only (checked below); needed once 012 hides lesson videos
set search_path = ''
as $$
declare
  v_id uuid;
  v_given text := payload ->> 'id';
begin
  if not public.is_admin() then
    raise exception 'Only admins can save courses.' using errcode = '42501';
  end if;

  if v_given ~ '^[0-9a-fA-F-]{36}$' then
    select id into v_id from public.courses where id = v_given::uuid;
  end if;

  if v_id is null then
    insert into public.courses (slug, title) values (payload ->> 'slug', coalesce(payload ->> 'title', ''))
    returning id into v_id;
  end if;

  update public.courses set
    slug          = payload ->> 'slug',
    title         = coalesce(payload ->> 'title', ''),
    subtitle      = coalesce(payload ->> 'subtitle', ''),
    description   = coalesce(payload ->> 'description', ''),
    category      = coalesce(payload ->> 'category', ''),
    subcategory   = coalesce(payload ->> 'subcategory', ''),
    level         = coalesce(payload ->> 'level', 'Beginner'),
    language      = coalesce(payload ->> 'language', 'English'),
    access_plan   = coalesce(payload ->> 'access', 'resident')::public.plan_tier,
    thumbnail     = coalesce(payload ->> 'thumbnail', ''),
    promo_video   = coalesce(payload ->> 'promoVideo', ''),
    outcomes      = coalesce(array(select jsonb_array_elements_text(payload -> 'outcomes')), '{}'),
    requirements  = coalesce(array(select jsonb_array_elements_text(payload -> 'requirements')), '{}'),
    audience      = coalesce(array(select jsonb_array_elements_text(payload -> 'audience')), '{}'),
    drip          = coalesce((payload ->> 'drip')::boolean, false),
    status        = coalesce(payload ->> 'status', 'draft')::public.course_status,
    instructor_id = nullif(payload ->> 'instructorId', '')::uuid
  where id = v_id;

  -- 1. Lessons that were removed.
  delete from public.course_lessons l
  where l.course_id = v_id
    and l.id not in (
      select lesson ->> 'id'
      from jsonb_array_elements(coalesce(payload -> 'sections', '[]')) section,
           jsonb_array_elements(coalesce(section -> 'lessons', '[]')) lesson
    );

  -- 2. Sections: add new ones, rename and reorder the rest.
  insert into public.course_sections (course_id, id, title, position)
  select v_id, section ->> 'id', coalesce(section ->> 'title', ''), (ord - 1)::int
  from jsonb_array_elements(coalesce(payload -> 'sections', '[]')) with ordinality as s(section, ord)
  on conflict (course_id, id) do update
    set title = excluded.title, position = excluded.position;

  -- 3. Lessons: add new ones, update and move the rest.
  insert into public.course_lessons
    (course_id, id, section_id, slug, title, summary, youtube, duration_seconds, preview, resources, source, position)
  select
    v_id,
    lesson ->> 'id',
    section ->> 'id',
    lesson ->> 'slug',
    coalesce(lesson ->> 'title', ''),
    coalesce(lesson ->> 'summary', ''),
    coalesce(lesson ->> 'youtube', ''),
    greatest(coalesce((lesson ->> 'durationSeconds')::int, 0), 0),
    coalesce((lesson ->> 'preview')::boolean, false),
    coalesce(lesson -> 'resources', '[]'),
    coalesce(lesson ->> 'source', ''),
    (lord - 1)::int
  from jsonb_array_elements(coalesce(payload -> 'sections', '[]')) section,
       jsonb_array_elements(coalesce(section -> 'lessons', '[]')) with ordinality as l(lesson, lord)
  on conflict (course_id, id) do update set
    section_id = excluded.section_id,
    slug = excluded.slug,
    title = excluded.title,
    summary = excluded.summary,
    youtube = excluded.youtube,
    duration_seconds = excluded.duration_seconds,
    preview = excluded.preview,
    resources = excluded.resources,
    source = excluded.source,
    position = excluded.position;

  -- 4. Sections that were removed (their lessons were moved or deleted above).
  delete from public.course_sections s
  where s.course_id = v_id
    and s.id not in (select section ->> 'id' from jsonb_array_elements(coalesce(payload -> 'sections', '[]')) section);

  -- 5. Total length, from the lessons.
  update public.courses c
  set duration_minutes = coalesce((select round(sum(duration_seconds) / 60.0) from public.course_lessons where course_id = v_id), 0)
  where c.id = v_id;

  return v_id;
end;
$$;

-- Row Level Security ────────────────────────────────────────────────────────

alter table public.instructors enable row level security;
alter table public.courses enable row level security;
alter table public.course_sections enable row level security;
alter table public.course_lessons enable row level security;

drop policy if exists "Anyone can read instructors" on public.instructors;
create policy "Anyone can read instructors"
  on public.instructors for select
  to anon, authenticated
  using (true);

drop policy if exists "Admins manage instructors" on public.instructors;
create policy "Admins manage instructors"
  on public.instructors for all
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

drop policy if exists "Anyone can read published courses" on public.courses;
create policy "Anyone can read published courses"
  on public.courses for select
  to anon, authenticated
  using (status = 'published');

drop policy if exists "Admins manage courses" on public.courses;
create policy "Admins manage courses"
  on public.courses for all
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

drop policy if exists "Anyone can read sections of published courses" on public.course_sections;
create policy "Anyone can read sections of published courses"
  on public.course_sections for select
  to anon, authenticated
  using (exists (select 1 from public.courses c where c.id = course_id and c.status = 'published'));

drop policy if exists "Admins manage sections" on public.course_sections;
create policy "Admins manage sections"
  on public.course_sections for all
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

drop policy if exists "Anyone can read lessons of published courses" on public.course_lessons;
create policy "Anyone can read lessons of published courses"
  on public.course_lessons for select
  to anon, authenticated
  using (exists (select 1 from public.courses c where c.id = course_id and c.status = 'published'));

drop policy if exists "Admins manage lessons" on public.course_lessons;
create policy "Admins manage lessons"
  on public.course_lessons for all
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- Privileges ────────────────────────────────────────────────────────────────
-- Counters (enrolled_count, review_count, rating_total) are only changed by triggers.

revoke all on table public.instructors, public.courses, public.course_sections, public.course_lessons from anon, authenticated;
grant select on table public.instructors, public.courses, public.course_sections, public.course_lessons to anon, authenticated;
grant insert, update, delete on table public.instructors, public.course_sections, public.course_lessons to authenticated;
grant insert, delete on table public.courses to authenticated;
grant update (slug, title, subtitle, description, category, subcategory, level, language, access_plan, thumbnail, promo_video,
              outcomes, requirements, audience, drip, status, instructor_id, duration_minutes,
              sample_students, sample_rating, sample_reviews, published_at)
  on table public.courses to authenticated;
