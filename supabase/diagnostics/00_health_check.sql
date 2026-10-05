-- ─────────────────────────────────────────────────────────────────────────────
-- Health check: is everything from the migrations in place?
--
-- Read-only. Run any time something looks wrong. Every row should show ✅.
-- A ❌ row tells you what to run to fix it.
--
-- (Data checks go through query_to_xml so this still runs, and reports ❌,
-- when a table doesn't exist yet.)
-- ─────────────────────────────────────────────────────────────────────────────

with checks (step, item, ok, fix) as (
  values
    -- 001 · profiles and roles
    (1, 'Table public.profiles exists',
        to_regclass('public.profiles') is not null,
        'Run migrations/…_profiles_and_roles.sql'),
    (1, 'RLS is on for profiles',
        coalesce((select relrowsecurity from pg_class where oid = to_regclass('public.profiles')), false),
        'Run migrations/…_profiles_and_roles.sql'),
    (1, 'Sign-up trigger on_auth_user_created exists',
        exists (select 1 from pg_trigger where tgname = 'on_auth_user_created' and tgrelid = 'auth.users'::regclass),
        'Run migrations/…_profiles_and_roles.sql'),
    (1, 'Email-sync trigger on_auth_user_email_changed exists',
        exists (select 1 from pg_trigger where tgname = 'on_auth_user_email_changed' and tgrelid = 'auth.users'::regclass),
        'Run migrations/…_profiles_and_roles.sql'),
    (1, 'Function public.is_admin() exists',
        to_regprocedure('public.is_admin()') is not null,
        'Run migrations/…_profiles_and_roles.sql'),
    (1, 'Every account has a profile row',
        case when to_regclass('public.profiles') is null then false
             else query_to_xml('select not exists (select 1 from auth.users u left join public.profiles p on p.id = u.id where p.id is null) as ok', false, true, '')::text like '%<ok>true</ok>%'
        end,
        'Re-run migrations/…_profiles_and_roles.sql (it backfills missing profiles)'),
    (1, 'At least one admin exists',
        case when to_regclass('public.profiles') is null then false
             else query_to_xml('select exists (select 1 from public.profiles where role = ''admin'') as ok', false, true, '')::text like '%<ok>true</ok>%'
        end,
        'Sign up, then run scripts/make-admin.sql with your email'),

    -- 002 · affiliate applications
    (2, 'Table public.affiliate_applications exists',
        to_regclass('public.affiliate_applications') is not null,
        'Run migrations/…_affiliate_applications.sql'),
    (2, 'RLS is on for affiliate_applications',
        coalesce((select relrowsecurity from pg_class where oid = to_regclass('public.affiliate_applications')), false),
        'Run migrations/…_affiliate_applications.sql'),
    (2, 'Referral-code trigger exists',
        exists (select 1 from pg_trigger where tgname = 'affiliate_applications_on_status_change'),
        'Run migrations/…_affiliate_applications.sql'),

    -- 003 · avatar storage
    (3, 'Storage bucket "avatars" exists and is public',
        exists (select 1 from storage.buckets where id = 'avatars' and public),
        'Run migrations/…_avatar_storage.sql'),
    (3, 'All 4 avatar storage policies exist',
        (select count(*) from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname ilike '%avatar%') = 4,
        'Run migrations/…_avatar_storage.sql'),

    -- 004 · courses
    (4, 'Tables instructors, courses, course_sections, course_lessons exist',
        to_regclass('public.instructors') is not null and to_regclass('public.courses') is not null
        and to_regclass('public.course_sections') is not null and to_regclass('public.course_lessons') is not null,
        'Run migrations/…_courses.sql'),
    (4, 'Function save_course() exists',
        to_regprocedure('public.save_course(jsonb)') is not null,
        'Run migrations/…_courses.sql'),

    -- 005 · blog
    (5, 'Table blog_posts exists',
        to_regclass('public.blog_posts') is not null,
        'Run migrations/…_blog.sql'),

    -- 006 · challenges
    (6, 'Tables challenges, challenge_entries exist',
        to_regclass('public.challenges') is not null and to_regclass('public.challenge_entries') is not null,
        'Run migrations/…_challenges.sql'),
    (6, 'Entry-count trigger exists',
        exists (select 1 from pg_trigger where tgname = 'challenge_entries_count'),
        'Run migrations/…_challenges.sql'),

    -- 007 · learning
    (7, 'Profiles have plan and status columns',
        exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'profiles' and column_name = 'plan')
        and exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'profiles' and column_name = 'status'),
        'Run migrations/…_learning.sql'),
    (7, 'Tables enrollments, lesson_progress, course_reviews, mix_submissions exist',
        to_regclass('public.enrollments') is not null and to_regclass('public.lesson_progress') is not null
        and to_regclass('public.course_reviews') is not null and to_regclass('public.mix_submissions') is not null,
        'Run migrations/…_learning.sql'),
    (7, 'Plan/status guard trigger exists',
        exists (select 1 from pg_trigger where tgname = 'profiles_guard'),
        'Run migrations/…_learning.sql'),

    -- 008 · settings and media
    (8, 'Table site_settings exists',
        to_regclass('public.site_settings') is not null,
        'Run migrations/…_settings_media.sql'),
    (8, 'Storage bucket "media" exists and is public',
        exists (select 1 from storage.buckets where id = 'media' and public),
        'Run migrations/…_settings_media.sql'),
    (8, 'All 4 media storage policies exist',
        (select count(*) from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname ilike '%media files%') = 4,
        'Run migrations/…_settings_media.sql'),
    (8, 'Table media_assets exists',
        to_regclass('public.media_assets') is not null,
        'Run migrations/…_settings_media.sql'),

    -- 009 · payments and affiliates
    (9, 'Tables payments, payouts, affiliate_payouts, referral_clicks exist',
        to_regclass('public.payments') is not null and to_regclass('public.payouts') is not null
        and to_regclass('public.affiliate_payouts') is not null and to_regclass('public.referral_clicks') is not null,
        'Run migrations/…_payments_affiliates.sql'),
    (9, 'Referral functions exist',
        to_regprocedure('public.track_referral_click(text,text,text)') is not null and to_regprocedure('public.attach_referral(text)') is not null,
        'Run migrations/…_payments_affiliates.sql'),

    -- 010 · admin views
    (10, 'Views student_overview, enrollment_progress, affiliate_overview, admin_activity exist',
        to_regclass('public.student_overview') is not null and to_regclass('public.enrollment_progress') is not null
        and to_regclass('public.affiliate_overview') is not null and to_regclass('public.admin_activity') is not null,
        'Run migrations/…_admin_views.sql'),

    -- 011 · seed
    (11, 'Site content is loaded (instructors, courses, posts, challenges, settings)',
        case when to_regclass('public.site_settings') is null or to_regclass('public.challenges') is null
               or to_regclass('public.blog_posts') is null or to_regclass('public.courses') is null then false
             else query_to_xml('select (select count(*) from public.instructors) > 0 and (select count(*) from public.courses) > 0
                                  and (select count(*) from public.blog_posts) > 0 and (select count(*) from public.challenges) > 0
                                  and exists (select 1 from public.site_settings where id = ''site'') as ok', false, true, '')::text like '%<ok>true</ok>%'
        end,
        'Run migrations/…_seed_content.sql'),
    (11, 'Every course has at least one lesson',
        case when to_regclass('public.course_lessons') is null then false
             else query_to_xml('select not exists (select 1 from public.courses c where c.status = ''published''
                                  and not exists (select 1 from public.course_lessons l where l.course_id = c.id)) as ok', false, true, '')::text like '%<ok>true</ok>%'
        end,
        'Add lessons in Studio → Courses, or re-run migrations/…_seed_content.sql'),

    -- 012 · course access
    (12, 'Functions lesson_video(), studio_lesson_media(), can_enter_challenge() exist',
        to_regprocedure('public.lesson_video(text,text)') is not null and to_regprocedure('public.studio_lesson_media(uuid)') is not null
        and to_regprocedure('public.can_enter_challenge(uuid)') is not null,
        'Run migrations/…_course_access.sql'),
    (12, 'Lesson videos are hidden from direct reads',
        case when to_regclass('public.course_lessons') is null then false
             else not has_column_privilege('anon', 'public.course_lessons', 'youtube', 'select')
                  and not has_column_privilege('authenticated', 'public.course_lessons', 'youtube', 'select')
        end,
        'Run migrations/…_course_access.sql'),
    (12, 'save_course() can save lesson videos (security definer)',
        coalesce((select prosecdef from pg_proc where oid = to_regprocedure('public.save_course(jsonb)')), false),
        'Run migrations/…_course_access.sql (it must come after …_courses.sql)'),
    (12, 'Challenge entries need an account',
        exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'challenge_entries' and policyname = 'Members enter open challenges their plan allows')
        and not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'challenge_entries' and policyname = 'Anyone can enter an open challenge'),
        'Run migrations/…_course_access.sql'),
    (12, 'Column profiles.email_prefs and table newsletter_subscribers exist',
        exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'profiles' and column_name = 'email_prefs')
        and to_regclass('public.newsletter_subscribers') is not null,
        'Run migrations/…_course_access.sql'),

    -- 013 · checkout and affiliates
    (13, 'Tables coupons, checkouts, affiliate_links, affiliate_accounts exist',
        to_regclass('public.coupons') is not null and to_regclass('public.checkouts') is not null
        and to_regclass('public.affiliate_links') is not null and to_regclass('public.affiliate_accounts') is not null,
        'Run migrations/…_checkout_affiliates.sql'),
    (13, 'Payments record discounts and coupon codes',
        exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'payments' and column_name = 'coupon_code')
        and exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'affiliate_applications' and column_name = 'customer_discount'),
        'Run migrations/…_checkout_affiliates.sql'),
    (13, 'Functions fulfill_checkout() and my_affiliate_*() exist',
        to_regprocedure('public.fulfill_checkout(text,numeric,numeric,public.payment_method,text,text,timestamptz)') is not null
        and to_regprocedure('public.my_affiliate_referrals()') is not null and to_regprocedure('public.my_affiliate_signups()') is not null
        and to_regprocedure('public.my_affiliate_clicks()') is not null,
        'Run migrations/…_checkout_affiliates.sql'),
    (13, 'Only the server can fulfil checkouts',
        case when to_regprocedure('public.fulfill_checkout(text,numeric,numeric,public.payment_method,text,text,timestamptz)') is null then false
             else not has_function_privilege('authenticated', 'public.fulfill_checkout(text,numeric,numeric,public.payment_method,text,text,timestamptz)', 'execute')
        end,
        'Re-run migrations/…_checkout_affiliates.sql'),

    -- 014 · store
    (14, 'Tables store_resources, store_files, store_downloads exist',
        to_regclass('public.store_resources') is not null and to_regclass('public.store_files') is not null
        and to_regclass('public.store_downloads') is not null,
        'Run migrations/…_store.sql'),
    (14, 'Functions store_download() and studio_store_files() exist',
        to_regprocedure('public.store_download(text,uuid[])') is not null and to_regprocedure('public.studio_store_files(uuid)') is not null,
        'Run migrations/…_store.sql'),
    (14, 'Store bucket exists and is private',
        exists (select 1 from storage.buckets where id = 'store' and not public),
        'Run migrations/…_store.sql'),
    (14, 'Store file locations are hidden from visitors',
        case when to_regclass('public.store_files') is null then false
             else not has_column_privilege('anon', 'public.store_files', 'path', 'select')
                  and not has_column_privilege('anon', 'public.store_files', 'url', 'select')
        end,
        'Re-run migrations/…_store.sql')
)
select
  case when ok then '✅' else '❌' end as status,
  step as migration,
  item,
  case when ok then '' else fix end as how_to_fix
from checks
order by step, ok, item;
