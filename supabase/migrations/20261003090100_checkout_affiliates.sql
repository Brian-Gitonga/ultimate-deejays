-- ─────────────────────────────────────────────────────────────────────────────
-- 013 · Checkout, coupons and the affiliate portal
--
-- checkouts          one row per "Pay" press: plan, price, discount, coupon and
--                    the affiliate who gets the commission. Written by the
--                    server only, so a buyer can't change the price.
-- coupons            promo codes made in Studio → Coupons (percent or fixed
--                    off, per plan, limits, dates).
-- affiliate codes    every approved affiliate's referral code also works as a
--                    coupon: the buyer gets a discount (affiliate_applications
--                    .customer_discount, or the default in Studio → Settings)
--                    and the affiliate gets the commission.
-- fulfill_checkout() turns a confirmed Paystack payment into a payment row:
--                    one transaction, safe to call twice (the return page and
--                    the webhook both call it).
-- affiliate_links    an affiliate's tracking links (?ref=CODE&sub=…)
-- affiliate_accounts an affiliate's payout method, tax details, notifications
--                    and code requests
-- my_affiliate_*()   what an affiliate may see of their own referrals: first
--                    name and initial only, never emails or payment details.
--
-- Requires 001–012. Safe to re-run.
-- ─────────────────────────────────────────────────────────────────────────────

-- Orders a 100% coupon pays for in full.
alter type public.payment_method add value if not exists 'free';

-- Coupons ───────────────────────────────────────────────────────────────────

create table if not exists public.coupons (
  id                uuid primary key default gen_random_uuid(),
  code              text not null unique check (code ~ '^[A-Z0-9]{3,20}$'),
  description       text not null default '' check (char_length(description) <= 200),
  discount_type     text not null default 'percent' check (discount_type in ('percent', 'fixed')),
  discount_value    numeric(10, 2) not null check (discount_value > 0),
  plans             public.plan_tier[] not null default '{}',
  max_redemptions   integer check (max_redemptions is null or max_redemptions > 0),
  redemptions       integer not null default 0,
  once_per_customer boolean not null default true,
  starts_at         timestamptz,
  expires_at        timestamptz,
  active            boolean not null default true,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  check (discount_type <> 'percent' or discount_value <= 100),
  check (expires_at is null or starts_at is null or expires_at > starts_at)
);

comment on table public.coupons is 'Promo codes (Studio → Coupons). Affiliate codes are not here: they come from affiliate_applications.';
comment on column public.coupons.plans is 'Plans the code works on. Empty = every paid plan.';

drop trigger if exists coupons_set_updated_at on public.coupons;
create trigger coupons_set_updated_at
  before update on public.coupons
  for each row execute function public.set_updated_at();

-- A code is either a promo code or an affiliate code, never both.
create or replace function public.coupons_code_unique()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if exists (select 1 from public.affiliate_applications a where a.code = new.code) then
    raise exception 'The code % already belongs to an affiliate.', new.code using errcode = '23505';
  end if;
  return new;
end;
$$;

revoke execute on function public.coupons_code_unique() from public, anon, authenticated;

drop trigger if exists coupons_code_unique on public.coupons;
create trigger coupons_code_unique
  before insert or update of code on public.coupons
  for each row execute function public.coupons_code_unique();

-- Affiliate codes skip codes that are already promo codes.
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
  while exists (select 1 from public.affiliate_applications where code = candidate)
     or exists (select 1 from public.coupons where code = candidate) loop
    candidate := stem || (100 + floor(random() * 900))::int;
  end loop;
  return candidate;
end;
$$;

alter table public.coupons enable row level security;

drop policy if exists "Admins manage coupons" on public.coupons;
create policy "Admins manage coupons"
  on public.coupons for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

revoke all on table public.coupons from anon, authenticated;
grant select, insert, delete on table public.coupons to authenticated;
grant update (code, description, discount_type, discount_value, plans, max_redemptions, once_per_customer, starts_at, expires_at, active)
  on table public.coupons to authenticated;

-- Affiliates: the discount their code gives buyers ───────────────────────────

alter table public.affiliate_applications
  add column if not exists customer_discount integer check (customer_discount is null or customer_discount between 0 and 90);

comment on column public.affiliate_applications.customer_discount is
  '% off for buyers using this affiliate''s code or link. NULL = the default in Studio → Settings → Affiliates.';

grant update (customer_discount) on table public.affiliate_applications to authenticated;

-- Checkouts ─────────────────────────────────────────────────────────────────

create table if not exists public.checkouts (
  id              uuid primary key default gen_random_uuid(),
  reference       text not null unique check (char_length(reference) <= 100),
  user_id         uuid not null references public.profiles (id) on delete cascade,
  plan            public.plan_tier not null,
  kind            text not null default 'purchase' check (kind in ('purchase', 'upgrade')),
  list_price      numeric(10, 2) not null check (list_price >= 0),
  discount        numeric(10, 2) not null default 0 check (discount >= 0),
  amount          numeric(10, 2) not null check (amount >= 0),
  currency        text not null default 'USD' check (char_length(currency) = 3),
  coupon_code     text not null default '',
  coupon_id       uuid references public.coupons (id) on delete set null,
  affiliate_id    uuid references public.affiliate_applications (user_id) on delete set null,
  commission_rate integer not null default 0 check (commission_rate between 0 and 90),
  ref_sub         text not null default '' check (char_length(ref_sub) <= 40),
  status          text not null default 'pending' check (status in ('pending', 'paid', 'failed', 'cancelled')),
  payment_id      uuid references public.payments (id) on delete set null,
  failure         text not null default '',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  paid_at         timestamptz,
  check (amount = list_price - discount)
);

comment on table public.checkouts is 'Orders started on /checkout. Written only by the server (secret key).';

create index if not exists checkouts_user_idx on public.checkouts (user_id, created_at desc);

drop trigger if exists checkouts_set_updated_at on public.checkouts;
create trigger checkouts_set_updated_at
  before update on public.checkouts
  for each row execute function public.set_updated_at();

alter table public.checkouts enable row level security;

drop policy if exists "Students see their checkouts" on public.checkouts;
create policy "Students see their checkouts"
  on public.checkouts for select to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists "Admins see all checkouts" on public.checkouts;
create policy "Admins see all checkouts"
  on public.checkouts for select to authenticated
  using ((select public.is_admin()));

revoke all on table public.checkouts from anon, authenticated;
grant select on table public.checkouts to authenticated;

-- Payments: what was discounted, and how the buyer found us ──────────────────

alter table public.payments add column if not exists discount numeric(10, 2) not null default 0;
alter table public.payments add column if not exists coupon_code text not null default '';
alter table public.payments add column if not exists ref_sub text not null default '';
alter table public.payments add column if not exists checkout_id uuid references public.checkouts (id) on delete set null;

-- fulfill_checkout() ────────────────────────────────────────────────────────
-- Called by the server (secret key) once Paystack confirms the payment, or
-- straight away for a 100%-off coupon. Records the payment (which upgrades
-- the plan, see 009), credits the affiliate, counts the coupon use. Calling it
-- again for the same reference just returns the same payment.

create or replace function public.fulfill_checkout(
  checkout_reference text,
  paid_amount numeric,
  paid_fee numeric,
  paid_method public.payment_method,
  paid_source text,
  paid_country text,
  paid_at timestamptz
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  c public.checkouts%rowtype;
  buyer record;
  v_payment uuid;
begin
  select * into c from public.checkouts where reference = checkout_reference for update;
  if not found then
    raise exception 'No checkout with reference %', checkout_reference using errcode = 'P0002';
  end if;
  if c.status = 'paid' then
    return c.payment_id;
  end if;
  if round(paid_amount, 2) <> c.amount then
    update public.checkouts set status = 'failed', failure = 'Amount paid (' || paid_amount || ') does not match ' || c.amount where id = c.id;
    raise exception 'Amount paid % does not match the order total %', paid_amount, c.amount using errcode = 'P0001';
  end if;

  select p.email, coalesce(nullif(p.full_name, ''), p.email) as name, p.location into buyer from public.profiles p where p.id = c.user_id;

  insert into public.payments (
    reference, user_id, customer_name, customer_email, country, plan, kind, amount, fee, currency, method, source,
    status, paid_at, affiliate_id, commission, discount, coupon_code, ref_sub, checkout_id
  ) values (
    c.reference, c.user_id, left(buyer.name, 120), coalesce(buyer.email, ''), left(coalesce(nullif(paid_country, ''), split_part(coalesce(buyer.location, ''), ',', -1), ''), 80),
    c.plan, c.kind, c.amount, coalesce(paid_fee, 0), c.currency, paid_method, left(coalesce(paid_source, ''), 120),
    'paid', coalesce(paid_at, now()), c.affiliate_id, round(c.amount * c.commission_rate / 100.0, 2), c.discount, c.coupon_code, c.ref_sub, c.id
  )
  on conflict (reference) do nothing
  returning id into v_payment;

  if v_payment is null then
    select id into v_payment from public.payments where reference = c.reference;
  end if;

  update public.checkouts set status = 'paid', paid_at = coalesce(fulfill_checkout.paid_at, now()), payment_id = v_payment where id = c.id;

  if c.coupon_id is not null then
    update public.coupons set redemptions = redemptions + 1 where id = c.coupon_id;
  end if;

  return v_payment;
end;
$$;

revoke execute on function public.fulfill_checkout(text, numeric, numeric, public.payment_method, text, text, timestamptz) from public, anon, authenticated;

-- Affiliate links ───────────────────────────────────────────────────────────

create table if not exists public.affiliate_links (
  id           uuid primary key default gen_random_uuid(),
  affiliate_id uuid not null default auth.uid() references public.affiliate_applications (user_id) on delete cascade,
  label        text not null check (char_length(label) between 1 and 60),
  path         text not null default '/' check (path ~ '^/' and char_length(path) <= 200),
  sub          text not null check (sub ~ '^[a-z0-9-]{1,32}$'),
  created_at   timestamptz not null default now(),
  unique (affiliate_id, sub)
);

comment on table public.affiliate_links is 'An affiliate''s saved tracking links. Clicks and sales are matched by sub.';

-- Affiliate accounts ────────────────────────────────────────────────────────

create table if not exists public.affiliate_accounts (
  affiliate_id       uuid primary key default auth.uid() references public.affiliate_applications (user_id) on delete cascade,
  payout_method      text not null default 'paypal' check (payout_method in ('paypal', 'mpesa', 'bank')),
  paypal_email       text not null default '' check (char_length(paypal_email) <= 254),
  mpesa_phone        text not null default '' check (char_length(mpesa_phone) <= 30),
  bank               jsonb not null default '{}' check (jsonb_typeof(bank) = 'object'),
  tax                jsonb not null default '{}' check (jsonb_typeof(tax) = 'object'),
  notifications      jsonb not null default '{"sale": true, "cleared": false, "payout": true, "newAssets": true, "monthly": true}' check (jsonb_typeof(notifications) = 'object'),
  website            text not null default '' check (char_length(website) <= 300),
  channels           text not null default '' check (char_length(channels) <= 1000),
  code_request       text check (code_request is null or code_request ~ '^[A-Z0-9]{4,14}$'),
  leave_requested_at timestamptz,
  updated_at         timestamptz not null default now()
);

comment on table public.affiliate_accounts is 'Payout method, tax details, notification choices and code requests of each affiliate.';

drop trigger if exists affiliate_accounts_set_updated_at on public.affiliate_accounts;
create trigger affiliate_accounts_set_updated_at
  before update on public.affiliate_accounts
  for each row execute function public.set_updated_at();

-- When an admin gives an affiliate the code they asked for, the request is done.
create or replace function public.affiliate_code_changed()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.code is distinct from old.code and new.code is not null then
    if exists (select 1 from public.coupons where code = new.code) then
      raise exception 'The code % is already a promo code.', new.code using errcode = '23505';
    end if;
    update public.affiliate_accounts set code_request = null where affiliate_id = new.user_id and code_request = new.code;
  end if;
  return new;
end;
$$;

revoke execute on function public.affiliate_code_changed() from public, anon, authenticated;

drop trigger if exists affiliate_applications_code_changed on public.affiliate_applications;
create trigger affiliate_applications_code_changed
  before update of code on public.affiliate_applications
  for each row execute function public.affiliate_code_changed();

-- Is the signed-in user an approved affiliate?
create or replace function public.is_approved_affiliate()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.affiliate_applications where user_id = (select auth.uid()) and status = 'approved');
$$;

alter table public.affiliate_links enable row level security;
alter table public.affiliate_accounts enable row level security;

drop policy if exists "Affiliates see their links" on public.affiliate_links;
create policy "Affiliates see their links"
  on public.affiliate_links for select to authenticated
  using (affiliate_id = (select auth.uid()));

drop policy if exists "Approved affiliates add links" on public.affiliate_links;
create policy "Approved affiliates add links"
  on public.affiliate_links for insert to authenticated
  with check (affiliate_id = (select auth.uid()) and (select public.is_approved_affiliate()));

drop policy if exists "Affiliates edit their links" on public.affiliate_links;
create policy "Affiliates edit their links"
  on public.affiliate_links for update to authenticated
  using (affiliate_id = (select auth.uid()))
  with check (affiliate_id = (select auth.uid()));

drop policy if exists "Affiliates delete their links" on public.affiliate_links;
create policy "Affiliates delete their links"
  on public.affiliate_links for delete to authenticated
  using (affiliate_id = (select auth.uid()));

drop policy if exists "Admins see all links" on public.affiliate_links;
create policy "Admins see all links"
  on public.affiliate_links for select to authenticated
  using ((select public.is_admin()));

drop policy if exists "Affiliates see their account" on public.affiliate_accounts;
create policy "Affiliates see their account"
  on public.affiliate_accounts for select to authenticated
  using (affiliate_id = (select auth.uid()));

drop policy if exists "Affiliates create their account" on public.affiliate_accounts;
create policy "Affiliates create their account"
  on public.affiliate_accounts for insert to authenticated
  with check (affiliate_id = (select auth.uid()));

drop policy if exists "Affiliates update their account" on public.affiliate_accounts;
create policy "Affiliates update their account"
  on public.affiliate_accounts for update to authenticated
  using (affiliate_id = (select auth.uid()))
  with check (affiliate_id = (select auth.uid()));

drop policy if exists "Admins manage affiliate accounts" on public.affiliate_accounts;
create policy "Admins manage affiliate accounts"
  on public.affiliate_accounts for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

revoke all on table public.affiliate_links, public.affiliate_accounts from anon, authenticated;
grant select, delete on table public.affiliate_links to authenticated;
grant insert (affiliate_id, label, path, sub) on table public.affiliate_links to authenticated;
grant update (label, path) on table public.affiliate_links to authenticated;
grant select on table public.affiliate_accounts to authenticated;
grant insert (affiliate_id, payout_method, paypal_email, mpesa_phone, bank, tax, notifications, website, channels, code_request, leave_requested_at)
  on table public.affiliate_accounts to authenticated;
grant update (payout_method, paypal_email, mpesa_phone, bank, tax, notifications, website, channels, code_request, leave_requested_at)
  on table public.affiliate_accounts to authenticated;

-- What an affiliate sees of their own referrals ──────────────────────────────
-- SECURITY DEFINER because affiliates can't read other people's payments or
-- profiles. Only aggregates and first-name-and-initial come back.

create or replace function public.my_affiliate_referrals()
returns table (
  id uuid,
  paid_at timestamptz,
  customer text,
  country text,
  plan public.plan_tier,
  kind text,
  amount numeric,
  commission numeric,
  status public.payment_status,
  refunded_at timestamptz,
  used_code boolean,
  ref_sub text
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    p.id,
    p.paid_at,
    case
      when coalesce(p.customer_name, '') = '' then 'Student'
      when position(' ' in trim(p.customer_name)) > 0
        then split_part(trim(p.customer_name), ' ', 1) || ' ' || left(split_part(trim(p.customer_name), ' ', 2), 1) || '.'
      else split_part(trim(p.customer_name), '@', 1)
    end,
    p.country,
    p.plan,
    p.kind,
    p.amount,
    p.commission,
    p.status,
    p.refunded_at,
    p.coupon_code <> '',
    p.ref_sub
  from public.payments p
  where p.affiliate_id = (select auth.uid())
  order by p.paid_at desc;
$$;

create or replace function public.my_affiliate_signups()
returns table (created_at timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  select p.referred_at from public.profiles p
  where p.referred_by = (select auth.uid()) and p.referred_at is not null
  order by p.referred_at;
$$;

create or replace function public.my_affiliate_clicks()
returns table (day date, sub text, clicks integer)
language sql
stable
security definer
set search_path = ''
as $$
  select rc.created_at::date, rc.sub, count(*)::int
  from public.referral_clicks rc
  where rc.affiliate_id = (select auth.uid())
  group by 1, 2
  order by 1;
$$;

revoke execute on function public.my_affiliate_referrals(), public.my_affiliate_signups(), public.my_affiliate_clicks() from public, anon;
grant execute on function public.my_affiliate_referrals(), public.my_affiliate_signups(), public.my_affiliate_clicks() to authenticated;
