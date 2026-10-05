-- ─────────────────────────────────────────────────────────────────────────────
-- Create a promo code from the SQL editor (Studio → Coupons does the same).
-- Edit the values, then run. Codes are capital letters and numbers, 3–20 long,
-- and can't match an affiliate's referral code.
--
-- discount_type: 'percent' (discount_value 1–100) or 'fixed' (an amount in
-- your store currency). plans: '{}' = every paid plan, or '{resident}',
-- '{headliner}', '{resident,headliner}'.
-- ─────────────────────────────────────────────────────────────────────────────

insert into public.coupons (code, description, discount_type, discount_value, plans, max_redemptions, once_per_customer, starts_at, expires_at)
values ('LAUNCH20', 'Launch week', 'percent', 20, '{}', 100, true, now(), now() + interval '7 days')
returning code, discount_type, discount_value, plans, max_redemptions, expires_at;
