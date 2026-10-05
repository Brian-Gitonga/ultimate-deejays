-- ─────────────────────────────────────────────────────────────────────────────
-- Set the discount buyers get with one affiliate's code or link (Studio →
-- Affiliates → the affiliate → Buyer discount does the same).
-- null = use the default from Studio → Settings → Affiliates.
-- Should return one row. No rows = no affiliate with that email.
-- ─────────────────────────────────────────────────────────────────────────────

update public.affiliate_applications a
set customer_discount = 15
from public.profiles p
where p.id = a.user_id and p.email = lower('affiliate@example.com')
returning p.email, a.code, a.commission, a.customer_discount;
