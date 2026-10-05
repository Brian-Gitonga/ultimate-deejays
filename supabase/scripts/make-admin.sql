-- ─────────────────────────────────────────────────────────────────────────────
-- Make an account an admin.
--
-- 1. The person signs up on the site first.
-- 2. Change the email below, then Run.
-- 3. They refresh the page and see "Admin studio" in their account sidebar.
--
-- Should return one row. No rows = no account with that email
-- (check diagnostics/01_users_and_profiles.sql).
-- ─────────────────────────────────────────────────────────────────────────────

update public.profiles
set role = 'admin'
where email = lower('briangitongamwiti@gmail.com')
returning email, full_name, role;

-- To take admin away again, run this instead:
-- update public.profiles set role = 'user' where email = lower('you@example.com') returning email, role;
