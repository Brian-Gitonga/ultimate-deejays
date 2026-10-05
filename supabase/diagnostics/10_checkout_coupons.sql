-- ─────────────────────────────────────────────────────────────────────────────
-- Checkout: orders, promo codes and which affiliate got each sale.
-- Read-only. Run these one at a time (select a query, then Run selected).
--
-- status = 'pending' for a while → the buyer closed the payment page, or the
--   webhook isn't set up. The return page (/checkout/complete) and the webhook
--   both record the payment; see supabase/README.md → Payments.
-- status = 'failed' → the failure column says why (Paystack's message).
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Latest 50 orders.
select
  c.created_at,
  c.reference,
  p.email as buyer,
  c.plan,
  c.kind,
  c.list_price,
  c.discount,
  c.amount,
  c.currency,
  nullif(c.coupon_code, '') as code,
  a.code as affiliate,
  c.commission_rate as commission_pct,
  nullif(c.ref_sub, '') as link_sub,
  c.status,
  nullif(c.failure, '') as failure,
  c.paid_at
from public.checkouts c
left join public.profiles p on p.id = c.user_id
left join public.affiliate_applications a on a.user_id = c.affiliate_id
order by c.created_at desc
limit 50;

-- 2. Orders by status, last 30 days.
select status, count(*) as orders, sum(amount) as total
from public.checkouts
where created_at > now() - interval '30 days'
group by status
order by status;

-- 3. Promo codes and how they're doing.
select
  code,
  case when discount_type = 'percent' then discount_value || '%' else discount_value::text end as discount,
  coalesce(nullif(array_to_string(plans, ', '), ''), 'all paid plans') as plans,
  redemptions,
  max_redemptions,
  active,
  starts_at,
  expires_at,
  (select coalesce(sum(pay.amount), 0) from public.payments pay where pay.coupon_code = c.code and pay.status = 'paid') as revenue
from public.coupons c
order by created_at desc;

-- 4. Affiliate codes as discounts: what buyers get with each code.
select
  a.code,
  coalesce(nullif(p.dj_name, ''), p.full_name, p.email) as affiliate,
  a.status,
  a.commission as commission_pct,
  coalesce(a.customer_discount::text, (select (data -> 'affiliates' ->> 'customerDiscount') from public.site_settings where id = 'site'), '10') || '%' as buyer_discount,
  acc.payout_method,
  acc.code_request,
  acc.leave_requested_at
from public.affiliate_applications a
join public.profiles p on p.id = a.user_id
left join public.affiliate_accounts acc on acc.affiliate_id = a.user_id
where a.code is not null
order by a.status, a.code;
