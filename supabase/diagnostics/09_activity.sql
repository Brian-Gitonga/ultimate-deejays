-- ─────────────────────────────────────────────────────────────────────────────
-- The latest 100 things that happened (what Studio → Notifications lists):
-- sign-ups, affiliate applications, payments, refunds, challenge entries,
-- reviews and mixes. Read-only.
-- ─────────────────────────────────────────────────────────────────────────────

select created_at, kind, title, detail, href
from public.admin_activity
where created_at is not null
order by created_at desc
limit 100;
