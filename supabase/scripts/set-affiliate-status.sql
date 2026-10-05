-- ─────────────────────────────────────────────────────────────────────────────
-- Approve, pause or reject an affiliate application.
--
-- 1. The person applies from /account/affiliate on the site.
-- 2. Set the email and status below:
--      'approved' → they get a referral code and an "Affiliate dashboard" button
--      'paused'   → dashboard closed until approved again
--      'rejected' → the note is shown to them as the reason
-- 3. Run. They refresh their account page to see the change.
--
-- Should return one row. No rows = that person hasn't applied
-- (check diagnostics/02_affiliate_applications.sql).
-- ─────────────────────────────────────────────────────────────────────────────

update public.affiliate_applications a
set
  status = 'approved',
  commission = 20,     -- percent of each referred sale
  note = ''            -- optional; shown to the applicant if rejected
from public.profiles p
where p.id = a.user_id
  and p.email = lower('applicant@example.com')
returning p.email, a.status, a.code, a.commission;
