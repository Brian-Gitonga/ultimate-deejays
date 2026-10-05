-- ─────────────────────────────────────────────────────────────────────────────
-- Money: revenue by month, recent payments and payouts. Read-only.
-- Run each query on its own (select it, then Run), or all for the last one.
-- is_demo = true rows come from scripts/demo-data.sql.
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Revenue by month (what the dashboard chart shows)
select
  to_char(date_trunc('month', paid_at), 'YYYY-MM') as month,
  count(*) filter (where status = 'paid') as sales,
  count(*) filter (where status = 'refunded') as refunds,
  sum(amount) filter (where status = 'paid') as gross,
  sum(fee) as fees,
  sum(commission) as affiliate_commission,
  sum(case when status = 'paid' then amount - fee - commission else -fee end) as net,
  bool_or(is_demo) as includes_demo
from public.payments
group by 1
order by 1 desc;

-- 2. Latest payments
select reference, paid_at, customer_name, customer_email, plan, kind, amount, currency, method, status, commission, is_demo
from public.payments
order by paid_at desc
limit 50;

-- 3. Payouts to the business
select reference, period, amount, destination, status, paid_at, created_at, is_demo
from public.payouts
order by created_at desc;
