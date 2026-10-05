-- ─────────────────────────────────────────────────────────────────────────────
-- Demo data: sample activity so the studio has numbers to look at
--
-- Adds, all marked is_demo = true:
--   • ~9 months of plan purchases (a few refunded), ending today
--   • monthly business payouts for the finished months
--   • challenge entries for open challenges
--   • reviews on published courses, and mixes waiting for feedback
--   • referral clicks, referred sales and payouts for approved affiliates
--     (approve one first if you want affiliate numbers)
--
-- Amounts use the currency and plan prices in Studio → Settings, so switch
-- the currency first (e.g. scripts/set-currency-kes.sql), then add demo data.
--
-- Remove it all with scripts/remove-demo-data.sql. Real rows are never touched.
-- Running this twice adds a second batch, so remove first if you re-run.
--
-- Requires migrations 001–011.
-- ─────────────────────────────────────────────────────────────────────────────

do $$
declare
  v_first_names text[] := array['Amani','Lena','Kofi','Ravi','Sam','Jordan','Sofía','Yuki','Thandi','Lucas','Chloé','Ethan','Aisha','Mateo','Hana','Noah','Zara','Diego','Grace','Oliver','Priya','Marcus','Nia','Tomás','Emma','Kwame'];
  v_last_names  text[] := array['Otieno','Müller','Asante','Patel','Okafor','Blake','Ramírez','Sato','Nkosi','Oliveira','Martin','Brooks','Bello','Rossi','Kim','Williams','Ahmed','Fernández','Wanjiku','Jensen','Sharma','Johnson','Kamau','Silva'];
  v_countries   text[] := array['Kenya','United States','United Kingdom','Nigeria','South Africa','Germany','Canada','Ghana','Brazil','France','India','Mexico','Australia','Netherlands'];
  v_brands      text[] := array['Visa','Mastercard','Amex'];
  -- Gross revenue per month, oldest first; the last entry is the current month so far.
  v_targets     int[]  := array[2140, 2380, 2910, 2650, 3420, 3180, 3960, 4510, 1650];
  v_affiliates  uuid[];
  v_rates       int[];
  v_m           int;
  v_start       date;
  v_days        int;
  v_gross       numeric;
  v_n           int := 0;
  v_kind        text;
  v_plan        public.plan_tier;
  v_amount      numeric;
  v_method      public.payment_method;
  v_fee         numeric;
  v_first       text;
  v_last        text;
  v_refunded    boolean;
  v_paid        timestamptz;
  v_pick        int;
  v_affiliate   uuid;
  v_commission  numeric;
  v_row         record;
  v_i           int;
  v_currency    text;
  v_res         numeric;
  v_head        numeric;
  v_scale       numeric;
begin
  perform setseed(0.42);

  -- Prices and currency from Studio → Settings (the seed's $79 / $149 if unset).
  select s.data -> 'general' ->> 'currency',
         (select (p ->> 'price')::numeric from jsonb_array_elements(s.data -> 'plans') p where p ->> 'slug' = 'resident'),
         (select (p ->> 'price')::numeric from jsonb_array_elements(s.data -> 'plans') p where p ->> 'slug' = 'headliner')
  into v_currency, v_res, v_head
  from public.site_settings s where s.id = 'site';
  v_currency := coalesce(v_currency, 'USD');
  v_res := coalesce(nullif(v_res, 0), 79);
  v_head := coalesce(nullif(v_head, 0), 149);
  -- The monthly revenue targets below are in dollars at $79 a plan; this scales them.
  v_scale := v_res / 79.0;

  select coalesce(array_agg(a.user_id order by a.applied_at), '{}'), coalesce(array_agg(a.commission order by a.applied_at), '{}')
  into v_affiliates, v_rates
  from public.affiliate_applications a
  where a.status = 'approved';

  -- Payments ────────────────────────────────────────────────────────────────
  for v_m in 1..9 loop
    v_start := (date_trunc('month', now()) - make_interval(months => 9 - v_m))::date;
    v_days := case when v_m = 9 then extract(day from now())::int
                   else extract(day from (v_start + interval '1 month - 1 day'))::int end;
    v_gross := 0;
    while v_gross < (v_targets[v_m] - 40) * v_scale loop
      v_kind := case when random() < 0.1 then 'upgrade' else 'purchase' end;
      v_plan := case when v_kind = 'upgrade' or random() > 0.72 then 'headliner' else 'resident' end;
      v_amount := case when v_kind = 'upgrade' then greatest(v_head - v_res, 1) when v_plan = 'headliner' then v_head else v_res end;
      v_method := case when random() < 0.55 then 'card' when random() < 0.6 then 'mobile_money' else 'paypal' end;
      v_fee := round(case v_method when 'card' then v_amount * 0.029 + 0.30 * v_scale
                                   when 'paypal' then v_amount * 0.0349 + 0.49 * v_scale
                                   else v_amount * 0.015 end, 2);
      v_first := v_first_names[1 + floor(random() * array_length(v_first_names, 1))::int];
      v_last := v_last_names[1 + floor(random() * array_length(v_last_names, 1))::int];
      v_paid := v_start + make_interval(days => floor(random() * v_days)::int, hours => 8 + floor(random() * 12)::int);
      v_refunded := random() < 0.035 and v_m < 9;
      v_affiliate := null;
      v_commission := 0;
      if v_kind = 'purchase' and coalesce(array_length(v_affiliates, 1), 0) > 0 and random() < 0.2 then
        v_pick := 1 + floor(random() * array_length(v_affiliates, 1))::int;
        v_affiliate := v_affiliates[v_pick];
        v_commission := case when v_refunded then 0 else round(v_amount * v_rates[v_pick] / 100.0, 2) end;
      end if;

      insert into public.payments (reference, customer_name, customer_email, country, plan, kind, amount, fee, currency, method, source,
                                   status, paid_at, refunded_at, affiliate_id, commission, is_demo)
      values (
        'demo_' || to_char(v_paid, 'YYMMDD') || '_' || lpad(v_n::text, 4, '0'),
        v_first || ' ' || v_last,
        lower(translate(v_first, 'íéáóúñüÍÉÁÓÚ', 'ieaounuIEAOU')) || '.' || lower(translate(v_last, 'íéáóúñüÍÉÁÓÚ', 'ieaounuIEAOU')) || v_n || '@example.com',
        v_countries[1 + floor(random() * array_length(v_countries, 1))::int],
        v_plan, v_kind, v_amount, v_fee, v_currency, v_method,
        case v_method when 'card' then v_brands[1 + floor(random() * 3)::int] || ' •••• ' || (1000 + floor(random() * 9000))::int
                      when 'mobile_money' then 'M-Pesa •••• ' || (100 + floor(random() * 900))::int
                      else lower(v_first) || '@paypal' end,
        case when v_refunded then 'refunded'::public.payment_status else 'paid'::public.payment_status end,
        v_paid,
        case when v_refunded then v_paid + interval '3 days' end,
        v_affiliate, v_commission, true
      );
      v_gross := v_gross + v_amount;
      v_n := v_n + 1;
    end loop;
  end loop;

  -- Business payouts: each finished month's net, paid at the end of the next month.
  for v_m in 1..8 loop
    v_start := (date_trunc('month', now()) - make_interval(months => 9 - v_m))::date;
    insert into public.payouts (amount, destination, status, period, paid_at, is_demo)
    select round(sum(case when p.status = 'paid' then p.amount - p.fee - p.commission else -p.fee end), 2),
           case when v_m % 3 = 1 then 'PayPal · studio@ultimatedeejays.com' else 'Bank •••• 4821' end,
           case when v_m = 8 then 'in-transit' else 'paid' end,
           to_char(v_start, 'Mon YYYY'),
           case when v_m = 8 then null else (v_start + interval '2 months - 1 day')::date end,
           true
    from public.payments p
    where p.is_demo and p.paid_at >= v_start and p.paid_at < v_start + interval '1 month'
    having sum(p.amount) > 0;
  end loop;

  -- Affiliates: clicks, and commission for months before last month paid out.
  for v_i in 1..coalesce(array_length(v_affiliates, 1), 0) loop
    insert into public.referral_clicks (affiliate_id, path, sub, is_demo, created_at)
    select v_affiliates[v_i],
           (array['/', '/pricing', '/courses/dj-fundamentals', '/courses'])[1 + floor(random() * 4)::int],
           (array['youtube', 'instagram-bio', 'newsletter', ''])[1 + floor(random() * 4)::int],
           true,
           now() - make_interval(days => floor(random() * 270)::int, hours => floor(random() * 24)::int)
    from generate_series(1, 120 + floor(random() * 380)::int);

    insert into public.affiliate_payouts (affiliate_id, amount, method, period, is_demo, created_at)
    select v_affiliates[v_i], sum(p.commission), 'PayPal', to_char(date_trunc('month', p.paid_at), 'Mon YYYY'), true,
           date_trunc('month', p.paid_at) + interval '2 months - 1 day'
    from public.payments p
    where p.is_demo and p.affiliate_id = v_affiliates[v_i] and p.status = 'paid'
      and p.paid_at < date_trunc('month', now()) - interval '1 month'
    group by date_trunc('month', p.paid_at)
    having sum(p.commission) > 0;
  end loop;

  -- Challenge entries for open challenges.
  for v_row in select c.id from public.challenges c where c.published and current_date between c.opens and c.closes loop
    insert into public.challenge_entries (challenge_id, name, email, youtube_url, youtube_id, status, is_demo, created_at)
    select v_row.id,
           v_first_names[1 + (g * 7) % array_length(v_first_names, 1)] || ' ' || v_last_names[1 + (g * 5) % array_length(v_last_names, 1)],
           'demo.entry' || g || '.' || left(v_row.id::text, 8) || '@example.com',
           'https://www.youtube.com/watch?v=' || v.vid,
           v.vid,
           case when g % 5 = 0 then 'shortlisted'::public.entry_status else 'submitted'::public.entry_status end,
           true,
           now() - make_interval(days => g, hours => g * 3)
    from generate_series(1, 6 + floor(random() * 6)::int) g,
         lateral (select (array['lrXFmNjNQZ0','irQXrpQdv_Y','bFlkhnPfU3Y','hUcH9LLqPpA','FVshXe200RI','44F0d2CbjM0'])[1 + g % 6] as vid) v;
  end loop;

  -- Reviews on published courses.
  for v_row in select c.id from public.courses c where c.status = 'published' loop
    insert into public.course_reviews (course_id, reviewer_name, reviewer_avatar, rating, body, is_demo, created_at)
    select v_row.id,
           v_first_names[1 + floor(random() * array_length(v_first_names, 1))::int] || ' '
             || left(v_last_names[1 + floor(random() * array_length(v_last_names, 1))::int], 1) || '.',
           '/images/students/student-' || (1 + floor(random() * 5))::int || '.jpg',
           case when random() < 0.75 then 5 else 4 end,
           (array[
             'Recorded my first clean mix after week two. The step-by-step drills made it click.',
             'Clear, practical and straight to the point. Exactly what I needed before my first gig.',
             'The lesson on phrasing changed how I hear every track. Worth it for that alone.',
             'Great pacing. I could practice each idea on my controller right after watching.',
             'Would love a longer section at the end, but everything here is gold.'
           ])[1 + floor(random() * 5)::int],
           true,
           now() - make_interval(days => floor(random() * 120)::int)
    from generate_series(1, 2 + floor(random() * 2)::int);
  end loop;

  -- Mixes waiting for feedback (two already reviewed).
  insert into public.mix_submissions (submitter_name, title, link, notes, is_demo, created_at)
  select v_first_names[1 + (g * 3) % array_length(v_first_names, 1)] || ' ' || v_last_names[1 + (g * 7) % array_length(v_last_names, 1)],
         (array['Friday warm-up set','Amapiano blend practice','First house mix','Open-format 30 min','Scratch routine take 3','Afro house sunset mix'])[g],
         'https://soundcloud.com/demo-dj-' || g || '/mix',
         (array['Are my transitions too long?','How is my EQ on the bass swaps?','Is the energy curve right for a warm-up?','Any tips on track selection?','Feedback on timing please.','Does the ending work?'])[g],
         true,
         now() - make_interval(days => g * 2)
  from generate_series(1, 6) g;

  update public.mix_submissions
  set feedback = 'Great selection and smooth blends. Shorten the long blend at 12:30 and cut the bass on the incoming track earlier, then this is gig-ready.'
  where is_demo and title in ('First house mix', 'Afro house sunset mix');

  raise notice 'Demo data added: % payments.', v_n;
end $$;

-- What was added:
select 'payments' as "table", count(*) as demo_rows from public.payments where is_demo
union all select 'payouts', count(*) from public.payouts where is_demo
union all select 'affiliate_payouts', count(*) from public.affiliate_payouts where is_demo
union all select 'referral_clicks', count(*) from public.referral_clicks where is_demo
union all select 'challenge_entries', count(*) from public.challenge_entries where is_demo
union all select 'course_reviews', count(*) from public.course_reviews where is_demo
union all select 'mix_submissions', count(*) from public.mix_submissions where is_demo;
