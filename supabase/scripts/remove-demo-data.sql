-- ─────────────────────────────────────────────────────────────────────────────
-- Remove demo data
--
-- Deletes every row scripts/demo-data.sql and scripts/demo-store.sql added
-- (is_demo = true) and nothing else. Counters (course ratings, challenge entry
-- counts) update themselves.
-- ─────────────────────────────────────────────────────────────────────────────

delete from public.affiliate_payouts where is_demo;
delete from public.referral_clicks where is_demo;
delete from public.payouts where is_demo;
delete from public.payments where is_demo;
delete from public.challenge_entries where is_demo;
delete from public.course_reviews where is_demo;
delete from public.mix_submissions where is_demo;

-- Demo store resources and their files, if the store exists (migration 014).
do $$
begin
  if to_regclass('public.store_resources') is not null then
    delete from public.store_resources where is_demo;
  end if;
end $$;

-- Should all be 0:
select 'payments' as "table", count(*) as demo_rows_left from public.payments where is_demo
union all select 'payouts', count(*) from public.payouts where is_demo
union all select 'affiliate_payouts', count(*) from public.affiliate_payouts where is_demo
union all select 'referral_clicks', count(*) from public.referral_clicks where is_demo
union all select 'challenge_entries', count(*) from public.challenge_entries where is_demo
union all select 'course_reviews', count(*) from public.course_reviews where is_demo
union all select 'mix_submissions', count(*) from public.mix_submissions where is_demo
union all select 'store_resources', case when to_regclass('public.store_resources') is null then 0
  else (xpath('/row/n/text()', query_to_xml('select count(*) as n from public.store_resources where is_demo', false, true, '')))[1]::text::bigint end;
