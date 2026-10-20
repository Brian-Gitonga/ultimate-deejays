-- ─────────────────────────────────────────────────────────────────────────────
-- 020 · The Lifetime plan (part 1 of 2)
--
-- Adds 'lifetime' to the plan levels, above Headliner: pay once, everything,
-- forever.
--
-- Run this on its own, then run 021 (…_monthly_plans.sql). Postgres can't
-- use a new plan value in the same run that adds it.
-- Safe to run again.
-- ─────────────────────────────────────────────────────────────────────────────

alter type public.plan_tier add value if not exists 'lifetime' after 'headliner';
