-- ─────────────────────────────────────────────────────────────────────────────
-- Switch the store to Kenyan shillings (KSh), the currency your Paystack
-- account charges in. Studio → Settings → General → Currency and Pricing do
-- the same, one field at a time.
--
-- Sets, in whole shillings (edit the numbers below first if you like):
--   Resident plan          KSh 10,000   (was $79)
--   Headliner plan         KSh 19,000   (was $149) → upgrading costs KSh 9,000
--   Affiliate min. payout  KSh 5,000
--   Your min. payout       KSh 10,000
--
-- Already-recorded payments keep the currency they were paid in. Demo data
-- made before this is in dollars: run scripts/remove-demo-data.sql, then
-- scripts/demo-data.sql again for demo numbers in shillings.
-- Promo codes with a fixed amount off (Studio → Coupons) are amounts in the
-- store currency: check them after switching.
--
-- Safe to re-run. Returns the new settings.
-- ─────────────────────────────────────────────────────────────────────────────

update public.site_settings s
set data = jsonb_set(
             jsonb_set(
               jsonb_set(
                 jsonb_set(s.data, '{general,currency}', '"KES"'),
                 '{plans}',
                 (
                   select jsonb_agg(
                            case p ->> 'slug'
                              when 'resident' then jsonb_set(p, '{price}', '10000')
                              when 'headliner' then jsonb_set(p, '{price}', '19000')
                              else p
                            end
                            order by ord
                          )
                   from jsonb_array_elements(s.data -> 'plans') with ordinality as t(p, ord)
                 )
               ),
               '{affiliates,minPayout}', '5000'
             ),
             '{payments,minimum}', '10000'
           )
where s.id = 'site'
returning
  s.data -> 'general' ->> 'currency' as currency,
  (select string_agg((p ->> 'name') || ' ' || (p ->> 'price'), ', ') from jsonb_array_elements(s.data -> 'plans') p) as plans,
  s.data -> 'affiliates' ->> 'minPayout' as affiliate_min_payout,
  s.data -> 'payments' ->> 'minimum' as payout_minimum;
