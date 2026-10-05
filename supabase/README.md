# Database (Supabase)

Every piece of SQL this project runs lives in this folder, so you can always see what the
database should look like and check what it actually has.

| Folder | What's in it | When to run it |
| --- | --- | --- |
| [migrations/](migrations/) | Builds the database: tables, triggers, security rules, and the site's starting content | **Once each, in filename order.** All are safe to re-run. |
| [diagnostics/](diagnostics/) | Read-only queries that show what's in the database | Any time, especially when something breaks |
| [scripts/](scripts/) | Admin jobs: make an admin, approve an affiliate, demo data… | When needed. Edit the email first where there is one |

## Running SQL

Supabase dashboard → **SQL Editor** → **New query** → paste the whole file → **Run**.

(Or with the CLI, after `npx supabase link`: `npm run db:push` applies every migration in order.)

## Migrations, in order

| # | File | What it adds |
| --- | --- | --- |
| 001 | `20261001120000_profiles_and_roles.sql` | Profiles, roles (user / admin), the sign-up trigger |
| 002 | `20261001120100_affiliate_applications.sql` | Affiliate applications, approval and referral codes |
| 003 | `20261001120200_avatar_storage.sql` | The profile-photo bucket |
| 004 | `20261002090000_courses.sql` | Instructors, courses, sections and lessons; `save_course()` |
| 005 | `20261002090100_blog.sql` | Blog posts (drafts, scheduled, published) |
| 006 | `20261002090200_challenges.sql` | Challenges and challenge entries |
| 007 | `20261002090300_learning.sql` | Student plans and suspension, enrollments, lesson progress, reviews, mix feedback |
| 008 | `20261002090400_settings_media.sql` | Site settings and the media library (bucket + table) |
| 009 | `20261002090500_payments_affiliates.sql` | Payments, payouts, affiliate payouts, referral clicks |
| 010 | `20261002090600_admin_views.sql` | Read-only views for the studio, and the notifications feed |
| 011 | `20261002090700_seed_content.sql` | The site's current content: 6 instructors, 18 courses with lessons, 17 posts, 7 challenges, settings |
| 012 | `20261003090000_course_access.sql` | Lesson videos only for signed-in students whose plan includes the course (`lesson_video()`), "continue where you left off", challenge entries for members only, email preferences, newsletter subscribers |
| 013 | `20261003090100_checkout_affiliates.sql` | Checkout orders, promo codes, affiliate codes as buyer discounts, `fulfill_checkout()`, the affiliate's own links, payout account and stats |
| 014 | `20261004090000_store.sql` | The store: downloadable resources and their files, the private `store` bucket, `store_download()` (sign-in, plan, download counts) |

Migration 011 is large (about 140 KB). Paste it in one go; it runs as a single transaction.
It skips anything that already exists, so it never overwrites edits made in the studio.

## First-time setup

1. **Run the migrations above, in order.** Already ran 001–013? Run 014.
2. **Run `diagnostics/00_health_check.sql`.** Every row should be ✅.
3. **Dashboard → Authentication → URL Configuration:**
   - Site URL: `http://localhost:3000`
   - Redirect URLs: add `http://localhost:3000/auth/callback`
   - (When you deploy, add your real domain's `/auth/callback` too.)
4. **While testing, turn off email confirmation:** Authentication → Sign In / Providers → Email →
   untick **Confirm email**. Sign-up then goes straight to the profile page. Supabase's built-in
   email sender only allows a few emails per hour. Turn it back on (with your own SMTP) before launch.
5. **Sign up on the site**, then run `scripts/make-admin.sql` with your email. Refresh: the
   **Admin studio** button appears in your account.
6. **Optional: run `scripts/demo-data.sql`** to fill Earnings, the Dashboard, Reviews, Mix feedback,
   challenge entries and (if an affiliate is approved) affiliate stats with sample activity. Every
   demo row is marked `is_demo`. `scripts/remove-demo-data.sql` deletes exactly those rows and nothing else.
7. **Payments:** set up Paystack (next section) to sell plans.
8. **Optional: run `scripts/demo-store.sql`** to fill /store with 8 sample resources (their files are
   images already in the site, so downloads work straight away). `scripts/remove-demo-data.sql` removes them.

## The store

`/store` lists downloadable resources like a video site: thumbnail, creator, download count. Anyone
can browse; downloading needs an account, and each resource is Free, Resident or Headliner (like
courses). Tick several cards to get them as one ZIP; a resource with several files downloads as a ZIP
too, or file by file.

| Piece | What it does |
| --- | --- |
| Studio → Store | Add a resource, upload its files or add links, pick the plan and creator, publish |
| `store` bucket (private) | Uploaded files. Nobody reads it directly: downloads get a 60-second signed link |
| Links | For files hosted elsewhere (Google Drive, Dropbox) or bigger than your upload limit. In a ZIP they become shortcuts |
| `store_download()` | Checks sign-in, plan and that it's published; logs the download; counts each person once a day |
| `/api/store/download` | Hands over one file, or streams a ZIP of several (never held in memory) |

Upload limit: Supabase's free plan allows **50 MB per file** (Storage → Settings on paid plans). For
bigger packs, upload a ZIP to Google Drive or Dropbox and add it as a link.

## Payments (Paystack)

1. Paystack dashboard → **Settings → API Keys & Webhooks**. Copy the **test** secret and public keys into
   `.env.local` (`PAYSTACK_SECRET_KEY=sk_test_…`, `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_…`), then restart
   `npm run dev`.
2. On the same page, set the **Webhook URL** to `<your site>/api/webhooks/paystack`. Paystack can't reach
   `localhost`, so while developing the return page records payments on its own. For a webhook on your
   machine, use a tunnel (e.g. `npx localtunnel --port 3000`) and paste that URL.
3. **Studio → Settings → General → Currency** must be a currency your Paystack account accepts (KES for a
   Kenyan account; NGN for Nigeria, ZAR for South Africa). Plan prices are in that currency.
   `scripts/set-currency-kes.sql` switches everything to Kenyan shillings in one go (plans KSh 10,000 /
   KSh 19,000, payout minimums); edit the numbers in it first if you want other prices.
4. Test a purchase: Pricing → **Become a Resident** → pay with a Paystack test card (Paystack's docs list
   them, e.g. `4084 0840 8408 4081`, any future date, CVV `408`). You land on "Welcome to Resident",
   the plan unlocks, and the sale shows in Studio → Earnings.
5. Going live: switch to the **live** keys and update the webhook URL to your real domain.

**Use test keys while developing.** With live keys (`sk_live_…`) every payment on your computer charges a
real card or M-Pesa number. If you do test with live keys, set a plan to a tiny price (e.g. KSh 10) in
Studio → Settings → Pricing first, and refund the payment in Studio → Earnings afterwards.

How an order works: `/checkout` prices it on the server (plan, upgrade credit, one discount code, the
referring affiliate) and saves a `checkouts` row → Paystack → `/checkout/complete` and the webhook
both call `fulfill_checkout()`, which records the payment once (upgrading the plan and crediting the
affiliate). A 100%-off code skips Paystack. Refunds in Studio → Earnings go back through Paystack.

## The affiliate program

| Step | What happens |
| --- | --- |
| Apply | `/account/affiliate`. Approve in Studio → Affiliates (or automatically: Settings → Affiliates) |
| Approved | They get a code (e.g. `DJKAYA`) and the **Affiliate dashboard** button |
| Promote | `site.com/?ref=DJKAYA`, or tracking links with `&sub=…` made in their dashboard, or the code itself |
| Click | Counted once per visitor; the browser remembers the code for the cookie length (Settings → Affiliates) |
| Sign-up | Credited to the affiliate (shows as a sign-up in both dashboards) |
| Purchase | The affiliate earns their commission on what the buyer paid; the buyer gets the affiliate's discount (each affiliate's own, or the default in Settings). A code typed at checkout wins over a link; the last link clicked wins over older ones; nobody can use their own code |
| Refund window | Commission is **pending** for the refund window (Settings → Payments), then **cleared** |
| Payout | Studio → Affiliates → Mark paid records it against their payout method; their dashboard shows it as **paid** |

Promo codes (Studio → Coupons) work the same way at checkout but don't pay anyone commission, unless
the buyer also came through an affiliate's link.

## Roles and access

| Who | Can open |
| --- | --- |
| Signed out | Public pages, including every course page and its outline. Playing a lesson asks them to sign in. `/account`, `/studio` and `/affiliate` redirect to `/login`; `/checkout` to `/sign-up` |
| `user` | `/account/*`: courses, profile, billing, settings, mix feedback, the affiliate program. Lessons of courses their plan includes, plus free-preview lessons of every course |
| `user` with an **approved** affiliate application | Everything above, plus `/affiliate`, via the **Affiliate dashboard** button |
| `admin` | `/account/*` and `/studio`, via the **Admin studio** button. Admins don't apply as affiliates. |
| `suspended` (Studio → Students) | Nothing: logged out, and log-in is refused |

The rules are enforced three times: [proxy.ts](../proxy.ts) (signed in or not),
[lib/dal.ts](../lib/dal.ts) (role, status and affiliate status, in each layout) and Row Level
Security in the database. Students can only ever read or change their own rows, can't change their
own plan, role or status, and only see published content.

## What each studio page reads and writes

| Studio page | Tables |
| --- | --- |
| Dashboard | `payments`, `payouts`, `courses`, `enrollments`, `course_reviews`, plus counts from `mix_submissions`, `challenge_entries`, `affiliate_applications` |
| Courses | `courses`, `course_sections`, `course_lessons` (saved together by `save_course()`; videos read through `studio_lesson_media()`) |
| Students | `student_overview` and `enrollment_progress` views; changes `profiles.plan` / `profiles.status` |
| Instructors | `instructors` |
| Mix feedback | `mix_submissions` (students send them from `/account/mixes`) |
| Challenges | `challenges`, `challenge_entries` (from the form on each challenge page) |
| Reviews | `course_reviews` (students write them on course pages) |
| Blog | `blog_posts` |
| Earnings | `payments` (with discount and code), `payouts`; refunds call Paystack |
| Affiliates | `affiliate_overview` view + `affiliate_accounts` (payout details, requests); changes `affiliate_applications` (status, commission, buyer discount, code), adds `affiliate_payouts` |
| Coupons | `coupons`, plus `payments` for what each code brought in |
| Store | `store_resources`, `store_files` (locations via `studio_store_files()`), `store_download_stats` view; uploads to the `store` bucket |
| Subscribers | `newsletter_subscribers` (the newsletter form on the site) |
| Media library | `media_assets` + the `media` storage bucket |
| Settings | `site_settings` (one row) |
| Notifications | `admin_activity` view + `admin_notification_state` |
| Search | All of the above |

Public pages read the same tables (published rows only). Saving in the studio updates the site
straight away; anything else (scheduled posts, challenge dates) shows within 5 minutes.

The student side: `lesson_video()` hands out lesson videos and enrolls (`enrollments`, with the last
lesson for "continue"), `lesson_progress` and `course_reviews` from the player, `challenge_entries`
from challenge pages, `checkouts` and `payments` (Billing), `profiles.email_prefs` (Settings). The
affiliate dashboard: `affiliate_links`, `affiliate_accounts`, `affiliate_payouts` and the
`my_affiliate_referrals()` / `my_affiliate_signups()` / `my_affiliate_clicks()` functions (first
name and initial only).

## Diagnostics

| File | Shows |
| --- | --- |
| `00_health_check.sql` | ✅/❌ for every table, trigger, policy and bucket, and what to run for each ❌ |
| `01_users_and_profiles.sql` | Every account with role, plan, affiliate status and confirmation |
| `02_affiliate_applications.sql` | Affiliate applications, pending first |
| `03_security.sql` | Policies and column permissions (for "permission denied" / RLS errors) |
| `04_storage.sql` | Profile photos and media library files |
| `05_content.sql` | Courses (lessons, figures shown), posts (live or not), challenges (state, entries) |
| `06_students.sql` | Students, course progress, and reviews/mixes waiting on you |
| `07_payments.sql` | Revenue by month, latest payments, payouts |
| `08_affiliate_stats.sql` | Clicks, sign-ups, sales, commission and what's owed per affiliate |
| `09_activity.sql` | The latest 100 events (what Notifications shows) |
| `10_checkout_coupons.sql` | Orders (pending, paid, failed), promo codes, each affiliate's buyer discount and requests |
| `11_course_access.sql` | Which plan each course needs, one student's courses and progress, who can read videos, newsletter totals |
| `12_store.sql` | Store resources (status, plan, files, downloads), where each file lives, files missing from the bucket, latest downloads |

## Scripts

| File | Does |
| --- | --- |
| `make-admin.sql` | Makes an account an admin |
| `set-affiliate-status.sql` | Approves, pauses or rejects an affiliate (Studio → Affiliates does the same) |
| `set-student-plan.sql` | Gives a student a plan without a payment (Studio → Students does the same) |
| `delete-user.sql` | Permanently deletes an account, for re-testing sign-up |
| `demo-data.sql` | Adds sample activity, all marked `is_demo` |
| `remove-demo-data.sql` | Deletes every demo row and nothing else |
| `clear-sample-figures.sql` | Before launch: stops showing the placeholder student counts, ratings and entry counts |
| `create-coupon.sql` | Makes a promo code (Studio → Coupons does the same) |
| `set-affiliate-discount.sql` | Sets the buyer discount for one affiliate's code and links |
| `set-currency-kes.sql` | Switches the store to Kenyan shillings: currency, plan prices, payout minimums |
| `set-launch-figures.sql` | Your contact details (phone/WhatsApp, location), the student count, and small realistic per-course student numbers; sets made-up ratings and reviews to 0 |
| `demo-store.sql` | Adds 8 sample store resources (marked `is_demo`; removed by `remove-demo-data.sql`) |

**About "sample figures":** the seeded courses keep their original placeholder numbers (e.g.
1,284 students, 4.9 stars). Real enrollments and reviews are added on top. `clear-sample-figures.sql`
zeroes the placeholders so only real numbers show.

## Troubleshooting

Start with `diagnostics/00_health_check.sql`. It names the step that's missing.

In development, error messages on the site end with the raw database error in `[brackets]`.
Search for that text below.

| What you see | Run | Likely fix |
| --- | --- | --- |
| A page says "Couldn't load courses / blog posts / …: Could not find the table" | `00_health_check.sql` | Run the missing migrations (004–011) |
| Courses, blog or challenges pages are empty | `05_content.sql` | Run migration 011 (the seed) |
| Sign-up says "Database error saving new user" | `00_health_check.sql` | The sign-up trigger failed or is missing. Re-run migration 001 |
| "…has no profile row" error after logging in | `01_users_and_profiles.sql` | Re-run migration 001. It backfills missing profiles |
| Log-in says "Confirm your email first" | `01_users_and_profiles.sql` (`email_confirmed`) | Click the email link, or turn off Confirm email (step 4) |
| Log-in says "This account is suspended" | `06_students.sql` | Reactivate them in Studio → Students |
| Email link opens `/login` with "That link has expired…" | n/a | Link opened in a different browser, or used twice. Log in normally (see the cross-device note below) |
| "permission denied for table …" | `03_security.sql` (query 2) | Re-run the migration for that table |
| "new row violates row-level security policy" | `03_security.sql` (query 1) | Someone is writing a row that isn't theirs, or the policy is missing |
| Studio save says "Only admins can …" | `01_users_and_profiles.sql` (`role`) | Your account isn't an admin: run `scripts/make-admin.sql` |
| "That's already taken: the slug or code must be unique" | `05_content.sql` | Another course/post/challenge uses that URL. Change it |
| Image upload fails in the studio | `04_storage.sql`, `00_health_check.sql` | Re-run migration 008 (media bucket) |
| Profile photo upload fails | `04_storage.sql`, `00_health_check.sql` | Re-run migration 003 |
| Student can't send a mix | `06_students.sql` (plan, mixes) | Warm-Up has no mix reviews; Resident has 2. Change their plan in Studio → Students |
| Student can't review a course | `06_students.sql` (query 2) | They must open the course while signed in first (that enrolls them) |
| Affiliate stats all 0 | `08_affiliate_stats.sql` | Clicks count when someone visits with `?ref=CODE`; sales come from checkout (or demo data) |
| "Could not find the function public.lesson_video" / lessons say "We couldn't load this lesson" | `00_health_check.sql` | Run migration 012 |
| Studio course editor: "Could not find the function public.studio_lesson_media" | `00_health_check.sql` | Run migration 012 |
| "permission denied for table course_lessons" when saving a course | `00_health_check.sql` (save_course row) | Re-run migration 012 (after 004, if you re-ran it) |
| Student sees "Unlock this lesson" | `11_course_access.sql` (query 2) | Their plan is below the course's. Change it in Studio → Students, or they upgrade at checkout |
| Affiliate dashboard, Coupons or checkout: "relation … does not exist" | `00_health_check.sql` | Run migration 013 |
| Checkout says "Online payments aren't switched on yet" | n/a | Add `PAYSTACK_SECRET_KEY` to `.env.local` and restart (see Payments) |
| Checkout: "We couldn't reach the payment page … Currency not supported" | n/a | Studio → Settings → Currency must be one your Paystack account accepts |
| Paid, but still on "Confirming your payment" | `10_checkout_coupons.sql` | Mobile money can take minutes. Otherwise check the webhook URL and the order's `failure` |
| Code at checkout: "That code isn't valid" | `10_checkout_coupons.sql` (queries 3–4) | Typo, a switched-off coupon, or an affiliate who isn't approved |
| Challenge entry: "…are open to Resident and Headliner members" | `06_students.sql` | Warm-Up members can enter Beginner challenges only |
| /store says "New downloads are on the way" but you added some | `12_store.sql` (query 1) | Run migration 014, and make sure each resource is **Published** |
| Studio → Store: "Could not find the function public.studio_store_files" | `00_health_check.sql` | Run migration 014 |
| Upload fails: "…bigger than your Supabase upload limit" | n/a | Add the file as a Google Drive/Dropbox link, or raise the limit (paid plans) |
| Upload fails: "new row violates row-level security policy" | `03_security.sql` | Only admins can upload. Re-run migration 014 for the bucket policies |
| A download says "That file is missing" | `12_store.sql` (query 3) | The file was deleted from the bucket. Upload it again in Studio → Store |
| Admin studio button missing | `01_users_and_profiles.sql` (`role`) | Run `scripts/make-admin.sql`, then refresh |
| Affiliate dashboard button missing | `02_affiliate_applications.sql` | Status must be `approved`. Approve in Studio → Affiliates |

Auth errors that never reach the database (wrong password, rate limits) are in the dashboard under
**Logs → Auth**.

### Email links that work on any device (optional)

By default, a confirmation link only signs you in if it's opened in the same browser that signed
up. To make links work anywhere, edit the templates in Authentication → Email Templates. In
**Confirm signup**, replace `{{ .ConfirmationURL }}` with:

```
{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=email&next=/account/profile
```

[app/auth/callback/route.ts](../app/auth/callback/route.ts) handles both link styles.

## Changing the database later

- **Never edit a migration that has already been run.** (One exception, already made: 004's
  `save_course()` now says `security definer`, so re-running 004 after 012 keeps course saving working.)
  Add a new file with a later timestamp,
  e.g. `npm run db:migration -- add_coupons` (or create `migrations/<yyyymmddhhmmss>_add_coupons.sql`).
- Update [lib/supabase/database.types.ts](../lib/supabase/database.types.ts) to match: by hand,
  or `npm run db:types` once the project is linked.
- Add a check for the new objects to `diagnostics/00_health_check.sql`.
