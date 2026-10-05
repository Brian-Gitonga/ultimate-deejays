-- ─────────────────────────────────────────────────────────────────────────────
-- 001 · Profiles and roles
--
-- Every account gets one row in public.profiles, created automatically when
-- someone signs up (trigger on auth.users). The `role` column decides what a
-- person can open:
--   user  → the account area (+ the affiliate dashboard once approved, see 002)
--   admin → the account area + the admin studio
--
-- People can edit their own profile but can never change their own role or
-- email (column privileges below). Make someone an admin with
-- supabase/scripts/make-admin.sql.
--
-- Safe to re-run: every statement checks before it creates.
-- ─────────────────────────────────────────────────────────────────────────────

-- Types ─────────────────────────────────────────────────────────────────────

do $$ begin
  create type public.app_role as enum ('user', 'admin');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.dj_experience as enum ('new', 'bedroom', 'gigging', 'pro');
exception when duplicate_object then null;
end $$;

-- Table ─────────────────────────────────────────────────────────────────────
-- Limits mirror the checks in lib/profile.ts, so bad data can't slip past the app.

create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  email       text not null default '',
  full_name   text not null default '' check (char_length(full_name) <= 80),
  dj_name     text not null default '' check (char_length(dj_name) <= 40),
  location    text not null default '' check (char_length(location) <= 80),
  bio         text not null default '' check (char_length(bio) <= 280),
  experience  public.dj_experience not null default 'new',
  genres      text[] not null default '{}' check (cardinality(genres) <= 20),
  instagram   text not null default '' check (char_length(instagram) <= 30),
  soundcloud  text not null default '' check (char_length(soundcloud) <= 200),
  avatar_url  text,
  role        public.app_role not null default 'user',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table public.profiles is 'One row per account. Created by the on_auth_user_created trigger.';
comment on column public.profiles.email is 'Copy of auth.users.email, kept in sync by a trigger. Read-only for users.';
comment on column public.profiles.role is 'user or admin. Only changeable from the SQL editor or the service role.';

-- updated_at ────────────────────────────────────────────────────────────────

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- New account → profile row ─────────────────────────────────────────────────
-- Name and photo come from the sign-up form (full_name) or Google (name, avatar_url).
-- If this function errors, Supabase reports "Database error saving new user" on sign-up.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.email, ''),
    left(coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', ''), 80),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Email change (after the user confirms it) → profile ──────────────────────

create or replace function public.handle_user_email_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.profiles set email = coalesce(new.email, '') where id = new.id;
  return new;
end;
$$;

revoke execute on function public.handle_user_email_change() from public, anon, authenticated;

drop trigger if exists on_auth_user_email_changed on auth.users;
create trigger on_auth_user_email_changed
  after update of email on auth.users
  for each row
  when (old.email is distinct from new.email)
  execute function public.handle_user_email_change();

-- Backfill: accounts created before this migration get a profile too.

insert into public.profiles (id, email, full_name, avatar_url)
select
  u.id,
  coalesce(u.email, ''),
  left(coalesce(u.raw_user_meta_data ->> 'full_name', u.raw_user_meta_data ->> 'name', ''), 80),
  u.raw_user_meta_data ->> 'avatar_url'
from auth.users u
on conflict (id) do nothing;

-- is_admin() ────────────────────────────────────────────────────────────────
-- Used by RLS policies. SECURITY DEFINER so it can read profiles without
-- triggering the profiles policies again (which would recurse).

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin'
  );
$$;

-- Row Level Security ────────────────────────────────────────────────────────

alter table public.profiles enable row level security;

drop policy if exists "Users can read their own profile" on public.profiles;
create policy "Users can read their own profile"
  on public.profiles for select
  to authenticated
  using ((select auth.uid()) = id);

drop policy if exists "Admins can read every profile" on public.profiles;
create policy "Admins can read every profile"
  on public.profiles for select
  to authenticated
  using ((select public.is_admin()));

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
  on public.profiles for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- Column privileges ─────────────────────────────────────────────────────────
-- Rows are created by the trigger, never by the app. Users may update only
-- these columns: role, email, id and timestamps are off-limits.

revoke all on table public.profiles from anon, authenticated;
grant select on table public.profiles to authenticated;
grant update (full_name, dj_name, location, bio, experience, genres, instagram, soundcloud, avatar_url)
  on table public.profiles to authenticated;
