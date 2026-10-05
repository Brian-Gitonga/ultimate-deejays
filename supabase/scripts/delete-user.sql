-- ─────────────────────────────────────────────────────────────────────────────
-- Permanently delete an account. Useful for re-testing sign-up with the same email.
--
-- Deletes the login, profile and affiliate application (cascade).
-- Their uploaded photo stays in storage; remove it in Storage → avatars.
-- THIS CANNOT BE UNDONE. Double-check the email, then Run.
-- ─────────────────────────────────────────────────────────────────────────────

delete from auth.users
where email = lower('test@example.com')
returning email, id;
