-- ─────────────────────────────────────────────────────────────────────────────
-- Give a student a plan without a payment (a gift, a refund fix, or testing
-- mix feedback limits). Studio → Students → "Change plan" does the same.
--
-- Plans: 'warm-up' (free), 'resident', 'headliner'.
-- Should return one row. No rows = no student with that email.
-- ─────────────────────────────────────────────────────────────────────────────

update public.profiles
set plan = 'resident'
where email = lower('student@example.com')
returning email, plan, status;
