-- ─────────────────────────────────────────────────────────────────────────────
-- 002 · Affiliate applications
--
-- Any signed-in user (not admins) can apply once from /account/affiliate.
-- An admin then sets the status:
--   pending  → waiting for review (set on apply)
--   approved → can open /affiliate; a referral code is generated automatically
--   paused   → temporarily switched off
--   rejected → not accepted
--
-- Until the studio has review buttons, approve from the SQL editor with
-- supabase/scripts/set-affiliate-status.sql.
--
-- Requires 001. Safe to re-run.
-- ─────────────────────────────────────────────────────────────────────────────

do $$ begin
  create type public.affiliate_status as enum ('pending', 'approved', 'paused', 'rejected');
exception when duplicate_object then null;
end $$;

create table if not exists public.affiliate_applications (
  user_id      uuid primary key references public.profiles (id) on delete cascade,
  channel      text not null check (char_length(channel) between 1 and 40),
  channel_url  text not null check (char_length(channel_url) between 1 and 300),
  audience     integer not null default 0 check (audience >= 0),
  pitch        text not null check (char_length(pitch) between 1 and 600),
  status       public.affiliate_status not null default 'pending',
  code         text unique check (code ~ '^[A-Z0-9]{3,20}$'),
  commission   integer not null default 20 check (commission between 0 and 90),
  note         text not null default '',
  applied_at   timestamptz not null default now(),
  reviewed_at  timestamptz,
  reviewed_by  uuid references public.profiles (id) on delete set null,
  approved_at  timestamptz,
  updated_at   timestamptz not null default now()
);

comment on table public.affiliate_applications is 'One per user. status = approved unlocks the affiliate dashboard.';
comment on column public.affiliate_applications.code is 'Referral code, generated on first approval.';
comment on column public.affiliate_applications.commission is 'Percent of each referred sale.';
comment on column public.affiliate_applications.note is 'Internal admin note. Shown to the applicant only when rejected.';

create index if not exists affiliate_applications_status_idx on public.affiliate_applications (status);

drop trigger if exists affiliate_applications_set_updated_at on public.affiliate_applications;
create trigger affiliate_applications_set_updated_at
  before update on public.affiliate_applications
  for each row execute function public.set_updated_at();

-- Referral codes ────────────────────────────────────────────────────────────
-- From the DJ name (or full name): "DJ Kaya" → DJKAYA, then DJKAYA417 if taken.

create or replace function public.generate_affiliate_code(base text)
returns text
language plpgsql
set search_path = ''
as $$
declare
  stem text := left(upper(regexp_replace(coalesce(base, ''), '[^A-Za-z0-9]', '', 'g')), 14);
  candidate text;
begin
  if char_length(stem) < 3 then
    stem := 'UDJ' || stem;
  end if;
  candidate := stem;
  while exists (select 1 from public.affiliate_applications where code = candidate) loop
    candidate := stem || (100 + floor(random() * 900))::int;
  end loop;
  return candidate;
end;
$$;

-- On review: stamp who/when, and give approved affiliates a code.

create or replace function public.affiliate_on_status_change()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  base text;
begin
  if new.status is distinct from old.status then
    new.reviewed_at := now();
    new.reviewed_by := coalesce((select auth.uid()), new.reviewed_by);

    if new.status = 'approved' then
      new.approved_at := coalesce(new.approved_at, now());
      if new.code is null then
        select coalesce(nullif(p.dj_name, ''), p.full_name) into base
        from public.profiles p where p.id = new.user_id;
        new.code := public.generate_affiliate_code(base);
      end if;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists affiliate_applications_on_status_change on public.affiliate_applications;
create trigger affiliate_applications_on_status_change
  before update on public.affiliate_applications
  for each row execute function public.affiliate_on_status_change();

-- Row Level Security ────────────────────────────────────────────────────────

alter table public.affiliate_applications enable row level security;

drop policy if exists "Users can read their own application" on public.affiliate_applications;
create policy "Users can read their own application"
  on public.affiliate_applications for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can apply for themselves" on public.affiliate_applications;
create policy "Users can apply for themselves"
  on public.affiliate_applications for insert
  to authenticated
  with check ((select auth.uid()) = user_id and not (select public.is_admin()));

drop policy if exists "Admins can read every application" on public.affiliate_applications;
create policy "Admins can read every application"
  on public.affiliate_applications for select
  to authenticated
  using ((select public.is_admin()));

drop policy if exists "Admins can review applications" on public.affiliate_applications;
create policy "Admins can review applications"
  on public.affiliate_applications for update
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

drop policy if exists "Admins can delete applications" on public.affiliate_applications;
create policy "Admins can delete applications"
  on public.affiliate_applications for delete
  to authenticated
  using ((select public.is_admin()));

-- Column privileges ─────────────────────────────────────────────────────────
-- Applicants can only fill in the application itself; status, code and
-- commission can only be changed by admins (the update policy above).

revoke all on table public.affiliate_applications from anon, authenticated;
grant select, delete on table public.affiliate_applications to authenticated;
grant insert (user_id, channel, channel_url, audience, pitch) on table public.affiliate_applications to authenticated;
grant update (status, code, commission, note) on table public.affiliate_applications to authenticated;
