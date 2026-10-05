-- ─────────────────────────────────────────────────────────────────────────────
-- 009 · Payments, payouts and affiliate tracking
--
-- payments           one row per plan purchase (written by the Paystack webhook
--                    once checkout exists; demo rows by scripts/demo-data.sql).
--                    Studio → Earnings. A paid payment upgrades the buyer's plan.
-- payouts            money the business withdraws (Studio → Earnings → Payouts)
-- affiliate_payouts  commission paid to affiliates (Studio → Affiliates → Pay)
-- referral_clicks    visits through an affiliate link (?ref=CODE)
--
-- Also: affiliate applications now follow Studio → Settings → Affiliates
-- (program on/off, default commission, auto-approve).
--
-- is_demo marks rows from scripts/demo-data.sql, which
-- scripts/remove-demo-data.sql deletes. Real rows never have it set.
--
-- Requires 001, 002, 007 and 008. Safe to re-run.
-- ─────────────────────────────────────────────────────────────────────────────

do $$ begin
  create type public.payment_method as enum ('card', 'paypal', 'mobile_money', 'bank_transfer');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.payment_status as enum ('paid', 'refunded');
exception when duplicate_object then null;
end $$;

-- Payments ──────────────────────────────────────────────────────────────────

create table if not exists public.payments (
  id             uuid primary key default gen_random_uuid(),
  reference      text not null unique check (char_length(reference) <= 100),
  user_id        uuid references public.profiles (id) on delete set null,
  customer_name  text not null default '' check (char_length(customer_name) <= 120),
  customer_email text not null default '' check (char_length(customer_email) <= 254),
  country        text not null default '' check (char_length(country) <= 80),
  plan           public.plan_tier not null,
  kind           text not null default 'purchase' check (kind in ('purchase', 'upgrade')),
  amount         numeric(10, 2) not null check (amount >= 0),
  fee            numeric(10, 2) not null default 0 check (fee >= 0),
  currency       text not null default 'USD' check (char_length(currency) = 3),
  method         public.payment_method not null default 'card',
  source         text not null default '' check (char_length(source) <= 120),
  status         public.payment_status not null default 'paid',
  paid_at        timestamptz not null default now(),
  refunded_at    timestamptz,
  affiliate_id   uuid references public.affiliate_applications (user_id) on delete set null,
  commission     numeric(10, 2) not null default 0 check (commission >= 0),
  is_demo        boolean not null default false,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

comment on table public.payments is 'Plan purchases. reference = the Paystack transaction reference.';
comment on column public.payments.source is 'How they paid, for display: "Visa •••• 4242", "M-Pesa 0712…", a PayPal email.';
comment on column public.payments.commission is 'Owed to the referring affiliate. Set to 0 on refund.';

create index if not exists payments_paid_at_idx on public.payments (paid_at desc);
create index if not exists payments_user_idx on public.payments (user_id);
create index if not exists payments_affiliate_idx on public.payments (affiliate_id) where affiliate_id is not null;

drop trigger if exists payments_set_updated_at on public.payments;
create trigger payments_set_updated_at
  before update on public.payments
  for each row execute function public.set_updated_at();

-- A paid purchase lifts the buyer to that plan (never down).
create or replace function public.payments_upgrade_plan()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status = 'paid' and new.user_id is not null then
    update public.profiles set plan = greatest(plan, new.plan) where id = new.user_id;
  end if;
  return null;
end;
$$;

revoke execute on function public.payments_upgrade_plan() from public, anon, authenticated;

drop trigger if exists payments_upgrade_plan on public.payments;
create trigger payments_upgrade_plan
  after insert on public.payments
  for each row execute function public.payments_upgrade_plan();

-- Refunds: stamp the date and cancel the affiliate's commission.
create or replace function public.payments_on_refund()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status = 'refunded' and old.status is distinct from 'refunded' then
    new.refunded_at := coalesce(new.refunded_at, now());
    new.commission := 0;
  elsif new.status = 'paid' then
    new.refunded_at := null;
  end if;
  return new;
end;
$$;

drop trigger if exists payments_on_refund on public.payments;
create trigger payments_on_refund
  before update of status on public.payments
  for each row execute function public.payments_on_refund();

-- Payouts (the business) ────────────────────────────────────────────────────

create sequence if not exists public.payout_number_seq start 1001;

create table if not exists public.payouts (
  id           uuid primary key default gen_random_uuid(),
  reference    text not null unique default ('PO-' || nextval('public.payout_number_seq')),
  amount       numeric(10, 2) not null check (amount > 0),
  destination  text not null default '' check (char_length(destination) <= 120),
  status       text not null default 'in-transit' check (status in ('in-transit', 'paid')),
  period       text not null default '' check (char_length(period) <= 40),
  requested_by uuid references public.profiles (id) on delete set null default auth.uid(),
  paid_at      date,
  is_demo      boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

comment on table public.payouts is 'Withdrawals of earnings to the business bank or PayPal account.';

drop trigger if exists payouts_set_updated_at on public.payouts;
create trigger payouts_set_updated_at
  before update on public.payouts
  for each row execute function public.set_updated_at();

-- Affiliate payouts ─────────────────────────────────────────────────────────

create table if not exists public.affiliate_payouts (
  id           uuid primary key default gen_random_uuid(),
  affiliate_id uuid not null references public.affiliate_applications (user_id) on delete cascade,
  amount       numeric(10, 2) not null check (amount > 0),
  method       text not null default '' check (char_length(method) <= 120),
  period       text not null default '' check (char_length(period) <= 40),
  note         text not null default '' check (char_length(note) <= 500),
  paid_by      uuid references public.profiles (id) on delete set null default auth.uid(),
  is_demo      boolean not null default false,
  created_at   timestamptz not null default now()
);

create index if not exists affiliate_payouts_affiliate_idx on public.affiliate_payouts (affiliate_id, created_at desc);

-- Referral clicks ───────────────────────────────────────────────────────────

create table if not exists public.referral_clicks (
  id           bigint generated always as identity primary key,
  affiliate_id uuid not null references public.affiliate_applications (user_id) on delete cascade,
  path         text not null default '/' check (char_length(path) <= 300),
  sub          text not null default '' check (char_length(sub) <= 40),
  is_demo      boolean not null default false,
  created_at   timestamptz not null default now()
);

create index if not exists referral_clicks_affiliate_idx on public.referral_clicks (affiliate_id, created_at desc);

-- Called by proxy.ts when someone arrives with ?ref=CODE. Unknown or
-- unapproved codes are ignored.
create or replace function public.track_referral_click(ref_code text, landing_path text default '/', sub_id text default '')
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_affiliate uuid;
begin
  select user_id into v_affiliate
  from public.affiliate_applications
  where code = upper(left(coalesce(ref_code, ''), 20)) and status = 'approved';

  if v_affiliate is null then
    return false;
  end if;

  insert into public.referral_clicks (affiliate_id, path, sub)
  values (v_affiliate, left(coalesce(nullif(landing_path, ''), '/'), 300), left(coalesce(sub_id, ''), 40));
  return true;
end;
$$;

revoke execute on function public.track_referral_click(text, text, text) from public;
grant execute on function public.track_referral_click(text, text, text) to anon, authenticated;

-- Called after sign-up: credits the affiliate whose link the new member came
-- through. Only works within a day of signing up, only once, and never for
-- your own code.
create or replace function public.attach_referral(ref_code text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_me uuid := (select auth.uid());
  v_affiliate uuid;
begin
  if v_me is null then
    return false;
  end if;

  select user_id into v_affiliate
  from public.affiliate_applications
  where code = upper(left(coalesce(ref_code, ''), 20)) and status = 'approved';

  if v_affiliate is null or v_affiliate = v_me then
    return false;
  end if;

  update public.profiles
  set referred_by = v_affiliate, referred_at = now()
  where id = v_me and referred_by is null and created_at > now() - interval '1 day';
  return found;
end;
$$;

revoke execute on function public.attach_referral(text) from public, anon;
grant execute on function public.attach_referral(text) to authenticated;

-- Applications follow Studio → Settings → Affiliates ────────────────────────
-- SECURITY DEFINER so a new code is checked against every existing code,
-- not just the ones the applicant can see.

create or replace function public.affiliate_on_apply()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  program jsonb;
  base text;
begin
  select data -> 'affiliates' into program from public.site_settings where id = 'site';

  if program is not null and coalesce((program ->> 'enabled')::boolean, true) = false then
    raise exception 'The affiliate program isn''t accepting applications right now.' using errcode = 'P0001';
  end if;

  if new.status = 'pending' and program is not null then
    new.commission := coalesce((program ->> 'defaultCommission')::int, new.commission);
    if coalesce((program ->> 'autoApprove')::boolean, false) then
      new.status := 'approved';
      new.approved_at := now();
      new.reviewed_at := now();
      select coalesce(nullif(p.dj_name, ''), p.full_name) into base from public.profiles p where p.id = new.user_id;
      new.code := coalesce(new.code, public.generate_affiliate_code(base));
    end if;
  end if;
  return new;
end;
$$;

revoke execute on function public.affiliate_on_apply() from public, anon, authenticated;

drop trigger if exists affiliate_applications_on_apply on public.affiliate_applications;
create trigger affiliate_applications_on_apply
  before insert on public.affiliate_applications
  for each row execute function public.affiliate_on_apply();

-- Row Level Security ────────────────────────────────────────────────────────

alter table public.payments enable row level security;
alter table public.payouts enable row level security;
alter table public.affiliate_payouts enable row level security;
alter table public.referral_clicks enable row level security;

drop policy if exists "Students see their payments" on public.payments;
create policy "Students see their payments"
  on public.payments for select to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists "Admins manage payments" on public.payments;
create policy "Admins manage payments"
  on public.payments for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

drop policy if exists "Admins manage payouts" on public.payouts;
create policy "Admins manage payouts"
  on public.payouts for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

drop policy if exists "Affiliates see their payouts" on public.affiliate_payouts;
create policy "Affiliates see their payouts"
  on public.affiliate_payouts for select to authenticated
  using (affiliate_id = (select auth.uid()));

drop policy if exists "Admins manage affiliate payouts" on public.affiliate_payouts;
create policy "Admins manage affiliate payouts"
  on public.affiliate_payouts for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

drop policy if exists "Affiliates see their clicks" on public.referral_clicks;
create policy "Affiliates see their clicks"
  on public.referral_clicks for select to authenticated
  using (affiliate_id = (select auth.uid()));

drop policy if exists "Admins see all clicks" on public.referral_clicks;
create policy "Admins see all clicks"
  on public.referral_clicks for select to authenticated
  using ((select public.is_admin()));

-- Privileges ────────────────────────────────────────────────────────────────
-- Payments are created by the webhook (service role), never from the browser.
-- Admins can refund (status) and correct a commission.

revoke all on table public.payments, public.payouts, public.affiliate_payouts, public.referral_clicks from anon, authenticated;
grant select on table public.payments to authenticated;
grant update (status, refunded_at, commission) on table public.payments to authenticated;

grant select, insert, delete on table public.payouts to authenticated;
grant update (status, paid_at, destination) on table public.payouts to authenticated;
grant usage on sequence public.payout_number_seq to authenticated;

grant select, insert, delete on table public.affiliate_payouts to authenticated;
grant select on table public.referral_clicks to authenticated;
