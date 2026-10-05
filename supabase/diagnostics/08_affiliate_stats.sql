-- ─────────────────────────────────────────────────────────────────────────────
-- Affiliate performance: clicks, sign-ups, sales, commission and what's owed.
-- Read-only. (The applications themselves: 02_affiliate_applications.sql.)
--
-- clicks = 0 for an approved affiliate → nobody has visited with ?ref=CODE yet.
-- ─────────────────────────────────────────────────────────────────────────────

select
  status,
  name,
  email,
  code,
  commission as commission_pct,
  clicks,
  signups,
  sales,
  revenue,
  earned,
  paid_out,
  earned - paid_out as owed,
  approved_at
from public.affiliate_overview
order by status, earned desc;
