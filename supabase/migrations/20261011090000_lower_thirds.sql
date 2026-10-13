-- ─────────────────────────────────────────────────────────────────────────────
-- 015 · Lower thirds replace challenges
--
-- Challenges are gone from the site, so this removes everything they used:
-- the challenges and challenge_entries tables (every entry with them), their
-- functions and types, the "Challenge entries" figures in the studio views,
-- the challenge email preference, the "Challenge images" media folder and the
-- challenge lines in the pricing highlights saved in Studio → Settings.
--
-- In their place, store resources get a "lower third" switch:
-- store_resources.lower_third. Resources with it on also appear on
-- /lower-thirds (and their page lives at /lower-thirds/<slug>).
--
-- Requires 001–014. Safe to re-run.
-- ─────────────────────────────────────────────────────────────────────────────

-- Studio views without challenge entries ────────────────────────────────────
-- student_overview loses a column, which "create or replace" can't do, so it's
-- dropped and made again.

drop view if exists public.student_overview;
create view public.student_overview with (security_invoker = true) as
select
  p.id,
  p.full_name,
  p.dj_name,
  p.email,
  p.avatar_url,
  p.location,
  p.plan,
  p.status,
  p.created_at,
  p.last_seen_at,
  p.updated_at,
  p.referred_by,
  (select count(*) from public.mix_submissions m where m.user_id = p.id)::int as mixes_submitted,
  (select coalesce(sum(pay.amount), 0) from public.payments pay where pay.user_id = p.id and pay.status = 'paid')::numeric(10, 2) as paid
from public.profiles p
where p.role = 'user';

create or replace view public.admin_activity with (security_invoker = true) as
select 'student:' || p.id as id, 'student' as kind,
       coalesce(nullif(p.full_name, ''), p.email) || ' created an account' as title,
       p.email as detail, '/studio/students?q=' || p.email as href, p.created_at as created_at
from public.profiles p where p.role = 'user'
union all
select 'affiliate:' || a.user_id, 'affiliate',
       coalesce(nullif(p.dj_name, ''), nullif(p.full_name, ''), p.email) || ' applied to the affiliate program',
       a.channel || ' · ' || a.channel_url, '/studio/affiliates', a.applied_at
from public.affiliate_applications a join public.profiles p on p.id = a.user_id
union all
select 'payment:' || pay.id, 'payment',
       coalesce(nullif(pay.customer_name, ''), pay.customer_email) || ' bought ' || initcap(replace(pay.plan::text, '-', ' ')),
       pay.currency || ' ' || pay.amount::text, '/studio/earnings', pay.paid_at
from public.payments pay
union all
select 'refund:' || pay.id, 'refund',
       'Refunded ' || coalesce(nullif(pay.customer_name, ''), pay.customer_email),
       pay.currency || ' ' || pay.amount::text, '/studio/earnings', pay.refunded_at
from public.payments pay where pay.refunded_at is not null
union all
select 'review:' || r.id, 'review', r.reviewer_name || ' rated ' || c.title || ' ' || r.rating || '/5',
       left(r.body, 140), '/studio/reviews', r.created_at
from public.course_reviews r join public.courses c on c.id = r.course_id
union all
select 'mix:' || m.id, 'mix', m.submitter_name || ' sent a mix for feedback',
       m.title, '/studio/feedback', m.created_at
from public.mix_submissions m;

revoke all on public.student_overview, public.admin_activity from anon, authenticated;
grant select on public.student_overview, public.admin_activity to authenticated;

-- Challenges: tables, functions and types ───────────────────────────────────
-- Dropping the tables takes their triggers, indexes and policies with them.

drop table if exists public.challenge_entries;
drop table if exists public.challenges;

drop function if exists public.challenge_entries_count();
drop function if exists public.challenge_is_open(uuid);
drop function if exists public.can_enter_challenge(uuid);

drop type if exists public.entry_status;
drop type if exists public.challenge_type;

-- Email preferences: no more challenge emails ────────────────────────────────

alter table public.profiles
  alter column email_prefs set default '{"new-courses": true, "feedback": true, "newsletter": false}'::jsonb;

update public.profiles set email_prefs = email_prefs - 'challenges' where email_prefs ? 'challenges';

-- Media library: "Challenge images" move to General ─────────────────────────

update public.media_assets set folder = 'general' where folder = 'challenges';

alter table public.media_assets drop constraint if exists media_assets_folder_check;
alter table public.media_assets add constraint media_assets_folder_check
  check (folder in ('general', 'courses', 'blog', 'instructors', 'resources', 'store'));

-- Pricing highlights saved in Studio → Settings: drop the challenge lines ─────

update public.site_settings s
set data = jsonb_set(s.data, '{plans}', (
  select coalesce(jsonb_agg(
           case when jsonb_typeof(p -> 'highlights') = 'array'
             then jsonb_set(p, '{highlights}', coalesce(
                    (select jsonb_agg(h order by i) from jsonb_array_elements(p -> 'highlights') with ordinality as hl(h, i)
                      where h #>> '{}' not ilike '%challenge%'),
                    '[]'::jsonb))
             else p
           end order by n), '[]'::jsonb)
  from jsonb_array_elements(s.data -> 'plans') with ordinality as pl(p, n)
))
where jsonb_typeof(s.data -> 'plans') = 'array'
  and s.data -> 'plans' @? '$[*].highlights[*] ? (@ like_regex "challenge" flag "i")';

-- Lower thirds ──────────────────────────────────────────────────────────────

alter table public.store_resources add column if not exists lower_third boolean not null default false;

comment on column public.store_resources.lower_third is 'A lower third (on-screen name and title graphic): also listed on /lower-thirds, where its page lives.';

create index if not exists store_resources_lower_third_idx on public.store_resources (published_at desc) where lower_third and status = 'published';

-- Admins set it from Studio → Store, like the other columns.
grant insert (id, slug, title, description, category, thumbnail, preview_url, access_plan, instructor_id, status, featured, lower_third)
  on table public.store_resources to authenticated;
grant update (slug, title, description, category, thumbnail, preview_url, access_plan, instructor_id, status, featured, lower_third)
  on table public.store_resources to authenticated;
