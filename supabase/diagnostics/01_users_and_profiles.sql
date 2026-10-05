-- ─────────────────────────────────────────────────────────────────────────────
-- Every account, its profile, role and affiliate status. Newest first.
--
-- Read-only. What to look for:
--   role = '— no profile —'  → the sign-up trigger didn't run. Re-run migration 001.
--   email_confirmed = false  → they haven't clicked the confirmation email, so log-in
--                              fails with "Confirm your email first".
-- ─────────────────────────────────────────────────────────────────────────────

select
  u.email,
  p.full_name,
  p.dj_name,
  coalesce(p.role::text, '— no profile —') as role,
  coalesce(a.status::text, '') as affiliate_status,
  u.email_confirmed_at is not null as email_confirmed,
  u.raw_app_meta_data ->> 'provider' as signed_up_with,
  p.avatar_url is not null as has_photo,
  u.created_at,
  u.last_sign_in_at,
  p.updated_at as profile_updated_at,
  u.id
from auth.users u
left join public.profiles p on p.id = u.id
left join public.affiliate_applications a on a.user_id = u.id
order by u.created_at desc;
