-- ─────────────────────────────────────────────────────────────────────────────
-- 006 · Challenges and entries
--
-- challenges         Studio → Challenges. Live / upcoming / ended comes from the
--                    dates, so it never goes stale.
-- challenge_entries  one row per entry from the public entry form. Anyone can
--                    enter a live challenge (signed in or not), once per email.
--                    Only admins can see entries; the public sees a count.
--
-- Requires 001. Safe to re-run.
-- ─────────────────────────────────────────────────────────────────────────────

do $$ begin
  create type public.challenge_type as enum ('scratch', 'mixing', 'transitions', 'genre');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.entry_status as enum ('submitted', 'shortlisted', 'winner', 'disqualified');
exception when duplicate_object then null;
end $$;

create table if not exists public.challenges (
  id             uuid primary key default gen_random_uuid(),
  slug           text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 100),
  title          text not null default '' check (char_length(title) <= 120),
  tagline        text not null default '' check (char_length(tagline) <= 200),
  type           public.challenge_type not null default 'mixing',
  difficulty     text not null default 'Beginner' check (difficulty in ('Beginner', 'Intermediate', 'Advanced')),
  opens          date not null default current_date,
  closes         date not null default (current_date + 30),
  image          text not null default '',
  prize          text not null default '' check (char_length(prize) <= 300),
  brief          text not null default '' check (char_length(brief) <= 5000),
  rules          text[] not null default '{}',
  judging        jsonb not null default '[]' check (jsonb_typeof(judging) = 'array'),
  inspiration    jsonb not null default '[]' check (jsonb_typeof(inspiration) = 'array'),
  winners        jsonb check (winners is null or jsonb_typeof(winners) = 'array'),
  published      boolean not null default false,
  entry_count    integer not null default 0,
  sample_entries integer not null default 0 check (sample_entries >= 0),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  check (closes >= opens)
);

comment on column public.challenges.judging is '[{ "label": "Timing", "weight": 50 }, …] (weights add up to 100).';
comment on column public.challenges.inspiration is '[{ "youtube", "title", "dj", "note" }, …]';
comment on column public.challenges.winners is '[{ "place": 1, "name", "avatar", "city" }, …] once judged; null before.';
comment on column public.challenges.entry_count is 'Real entries, kept up to date by a trigger. The site shows sample_entries + entry_count.';

drop trigger if exists challenges_set_updated_at on public.challenges;
create trigger challenges_set_updated_at
  before update on public.challenges
  for each row execute function public.set_updated_at();

-- Entries ───────────────────────────────────────────────────────────────────

create table if not exists public.challenge_entries (
  id           uuid primary key default gen_random_uuid(),
  challenge_id uuid not null references public.challenges (id) on delete cascade,
  user_id      uuid references public.profiles (id) on delete set null,
  name         text not null check (char_length(name) between 2 and 80),
  email        text not null check (char_length(email) between 3 and 254),
  youtube_url  text not null check (char_length(youtube_url) <= 300),
  youtube_id   text not null check (youtube_id ~ '^[A-Za-z0-9_-]{11}$'),
  status       public.entry_status not null default 'submitted',
  score        numeric(5, 2) check (score is null or score between 0 and 100),
  notes        text not null default '' check (char_length(notes) <= 2000),
  is_demo      boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

comment on column public.challenge_entries.notes is 'Judges'' private notes.';

create unique index if not exists challenge_entries_one_per_email on public.challenge_entries (challenge_id, lower(email));
create index if not exists challenge_entries_challenge_idx on public.challenge_entries (challenge_id, created_at desc);
create index if not exists challenge_entries_user_idx on public.challenge_entries (user_id);

drop trigger if exists challenge_entries_set_updated_at on public.challenge_entries;
create trigger challenge_entries_set_updated_at
  before update on public.challenge_entries
  for each row execute function public.set_updated_at();

-- Keep challenges.entry_count in step. SECURITY DEFINER because the person
-- entering can't update challenges themselves.
create or replace function public.challenge_entries_count()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.challenges c
  set entry_count = (select count(*) from public.challenge_entries e where e.challenge_id = c.id)
  where c.id = coalesce(new.challenge_id, old.challenge_id);
  return null;
end;
$$;

revoke execute on function public.challenge_entries_count() from public, anon, authenticated;

drop trigger if exists challenge_entries_count on public.challenge_entries;
create trigger challenge_entries_count
  after insert or delete on public.challenge_entries
  for each row execute function public.challenge_entries_count();

-- Is this challenge open for entries right now?
create or replace function public.challenge_is_open(target uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.challenges
    where id = target and published and current_date between opens and closes
  );
$$;

-- Row Level Security ────────────────────────────────────────────────────────

alter table public.challenges enable row level security;
alter table public.challenge_entries enable row level security;

drop policy if exists "Anyone can read published challenges" on public.challenges;
create policy "Anyone can read published challenges"
  on public.challenges for select
  to anon, authenticated
  using (published);

drop policy if exists "Admins manage challenges" on public.challenges;
create policy "Admins manage challenges"
  on public.challenges for all
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

drop policy if exists "Anyone can enter an open challenge" on public.challenge_entries;
create policy "Anyone can enter an open challenge"
  on public.challenge_entries for insert
  to anon, authenticated
  with check (
    public.challenge_is_open(challenge_id)
    and (user_id is null or user_id = (select auth.uid()))
  );

drop policy if exists "People can see their own entries" on public.challenge_entries;
create policy "People can see their own entries"
  on public.challenge_entries for select
  to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists "Admins manage entries" on public.challenge_entries;
create policy "Admins manage entries"
  on public.challenge_entries for all
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- Privileges ────────────────────────────────────────────────────────────────
-- Entrants can only fill in the form fields; status, score and notes are for judges.

revoke all on table public.challenges, public.challenge_entries from anon, authenticated;
grant select on table public.challenges to anon, authenticated;
grant insert, delete on table public.challenges to authenticated;
grant update (slug, title, tagline, type, difficulty, opens, closes, image, prize, brief, rules, judging, inspiration, winners,
              published, sample_entries)
  on table public.challenges to authenticated;

grant insert (challenge_id, user_id, name, email, youtube_url, youtube_id) on table public.challenge_entries to anon, authenticated;
grant select, delete on table public.challenge_entries to authenticated;
grant update (status, score, notes) on table public.challenge_entries to authenticated;
