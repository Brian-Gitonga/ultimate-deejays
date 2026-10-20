-- ─────────────────────────────────────────────────────────────────────────────
-- 021 · Monthly plans (part 2 of 2: run 020 first)
--
-- Resident and Headliner become monthly: each payment gives 30 days, paid
-- with any method (M-Pesa included, so nothing renews by itself). Paying
-- again before the end adds 30 days on top. Lifetime (020) is paid once.
--
-- profiles.base_plan        the plan a member keeps when a monthly plan ends:
--                           Warm-Up, or a plan paid for once (everyone who
--                           bought Resident or Headliner before this keeps
--                           it forever), or Lifetime.
-- profiles.plan_expires_at  when the monthly plan ends; empty = never.
--                           profiles.plan stays the plan they have now.
-- payments.billing          'monthly' or 'once' (everything before this was
--                           paid once).
-- payments / checkouts.kind  + 'renewal' (the same plan again).
-- expire_plans()            puts members whose month is up back on their
--                           base plan; runs every hour (pg_cron), and the
--                           site also does it for a member as they visit.
-- expire_my_plan()          the same for the signed-in member.
-- plan_allowances           + a row for Lifetime (unlimited, like Headliner).
--
-- Run after 020. Safe to run again.
-- ─────────────────────────────────────────────────────────────────────────────

-- Profiles ───────────────────────────────────────────────────────────────────

alter table public.profiles add column if not exists base_plan public.plan_tier not null default 'warm-up';
alter table public.profiles add column if not exists plan_expires_at timestamptz;

comment on column public.profiles.base_plan is 'The plan kept when a monthly plan ends: warm-up, a plan paid for once, or lifetime.';
comment on column public.profiles.plan_expires_at is 'When the current monthly plan ends; null = it doesn''t (free, paid once, lifetime, or granted by an admin).';

-- Everyone already on a paid plan paid once (or was given it): they keep it.
update public.profiles set base_plan = plan where plan_expires_at is null and base_plan is distinct from plan;

create index if not exists profiles_plan_expires_idx on public.profiles (plan_expires_at) where plan_expires_at is not null;

-- Admins change them from Studio → Students; the guard below stops anyone else.
grant update (base_plan, plan_expires_at) on table public.profiles to authenticated;

create or replace function public.profiles_guard()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_user in ('authenticated', 'anon') and not public.is_admin()
     and (new.plan is distinct from old.plan or new.status is distinct from old.status
          or new.base_plan is distinct from old.base_plan or new.plan_expires_at is distinct from old.plan_expires_at) then
    raise exception 'Only admins can change a plan or account status.' using errcode = '42501';
  end if;
  return new;
end;
$$;

-- Payments: monthly or once, and renewals ─────────────────────────────────

alter table public.payments add column if not exists billing text not null default 'once';
do $$ begin
  alter table public.payments add constraint payments_billing_check check (billing in ('once', 'monthly'));
exception when duplicate_object then null;
end $$;
comment on column public.payments.billing is 'monthly = 30 days of the plan; once = paid once (Lifetime, and every purchase before monthly plans).';

alter table public.payments drop constraint if exists payments_kind_check;
alter table public.payments add constraint payments_kind_check check (kind in ('purchase', 'upgrade', 'renewal'));
alter table public.checkouts drop constraint if exists checkouts_kind_check;
alter table public.checkouts add constraint checkouts_kind_check check (kind in ('purchase', 'upgrade', 'renewal'));

-- New Resident and Headliner payments are monthly from now on.
create or replace function public.payments_set_billing()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.billing := case when new.plan in ('resident', 'headliner') then 'monthly' else 'once' end;
  return new;
end;
$$;

drop trigger if exists payments_set_billing on public.payments;
create trigger payments_set_billing
  before insert on public.payments
  for each row execute function public.payments_set_billing();

-- A paid purchase gives the plan: 30 more days for a monthly plan, for good for Lifetime.
create or replace function public.payments_upgrade_plan()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  cur record;
begin
  if new.status <> 'paid' or new.user_id is null then
    return null;
  end if;
  select p.plan, p.base_plan, p.plan_expires_at into cur from public.profiles p where p.id = new.user_id for update;
  if not found then
    return null;
  end if;

  if new.billing = 'once' then
    -- Lifetime (or an old one-time purchase): kept for good, never down.
    update public.profiles
      set plan = greatest(plan, new.plan), base_plan = greatest(base_plan, new.plan), plan_expires_at = null
      where id = new.user_id;
  elsif cur.base_plan >= new.plan then
    -- They already keep this plan (or a higher one) for good: nothing to add.
    null;
  elsif cur.plan = new.plan and cur.plan_expires_at > now() then
    -- Renewing early: another 30 days after the current end.
    update public.profiles set plan_expires_at = cur.plan_expires_at + interval '30 days' where id = new.user_id;
  elsif cur.plan > new.plan and (cur.plan_expires_at is null or cur.plan_expires_at > now()) then
    -- Already on a higher plan right now (checkout doesn't sell this): keep it.
    null;
  else
    -- New, lapsed, or moving up from a lower monthly plan: 30 days from now.
    update public.profiles set plan = new.plan, plan_expires_at = now() + interval '30 days' where id = new.user_id;
  end if;
  return null;
end;
$$;

revoke execute on function public.payments_upgrade_plan() from public, anon, authenticated;

-- Ending months ───────────────────────────────────────────────────────────────

create or replace function public.expire_plans()
returns integer
language sql
security definer
set search_path = ''
as $$
  with ended as (
    update public.profiles
       set plan = base_plan, plan_expires_at = null
     where plan_expires_at is not null and plan_expires_at <= now()
    returning 1
  )
  select count(*)::integer from ended;
$$;

comment on function public.expire_plans() is 'Puts members whose monthly plan has ended back on their base plan. Runs hourly (pg_cron).';
revoke execute on function public.expire_plans() from public, anon, authenticated;

create or replace function public.expire_my_plan()
returns boolean
language sql
security definer
set search_path = ''
as $$
  with ended as (
    update public.profiles
       set plan = base_plan, plan_expires_at = null
     where id = (select auth.uid()) and plan_expires_at is not null and plan_expires_at <= now()
    returning 1
  )
  select exists (select 1 from ended);
$$;

comment on function public.expire_my_plan() is 'Ends the signed-in member''s monthly plan if its time is up (called by the site as they visit).';
revoke execute on function public.expire_my_plan() from public, anon;
grant execute on function public.expire_my_plan() to authenticated;

-- Every hour, when pg_cron is available (Supabase: Database → Extensions → pg_cron).
do $$
begin
  if exists (select 1 from pg_available_extensions where name = 'pg_cron') then
    create extension if not exists pg_cron;
    perform cron.schedule('expire-monthly-plans', '7 * * * *', 'select public.expire_plans()');
  else
    raise notice 'pg_cron isn''t available: monthly plans still end as members visit the site.';
  end if;
exception when others then
  raise notice 'Couldn''t schedule expire_plans() (%): monthly plans still end as members visit the site.', sqlerrm;
end $$;

-- Lifetime's allowance: unlimited, like Headliner ────────────────────────────

insert into public.plan_allowances (plan, downloads, edits, open_edits, period)
values ('lifetime', null, null, 3, 'month')
on conflict (plan) do nothing;
