-- ─────────────────────────────────────────────────────────────────────────────
-- Affiliate applications with the applicant's name and email.
-- Pending ones first, then newest. Read-only.
--
-- Approve or reject one with scripts/set-affiliate-status.sql.
-- ─────────────────────────────────────────────────────────────────────────────

select
  a.status,
  p.email,
  coalesce(nullif(p.dj_name, ''), p.full_name) as name,
  a.channel,
  a.channel_url,
  a.audience,
  a.code,
  a.commission as commission_pct,
  a.pitch,
  a.note,
  a.applied_at,
  a.reviewed_at,
  reviewer.email as reviewed_by
from public.affiliate_applications a
join public.profiles p on p.id = a.user_id
left join public.profiles reviewer on reviewer.id = a.reviewed_by
order by (a.status = 'pending') desc, a.applied_at desc;
