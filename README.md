# Ultimate Deejays

DJ courses, challenges and a blog, plus an instructor studio and an affiliate dashboard.
Built with Next.js 16 (App Router), Supabase (Postgres, Auth, Storage) and Paystack.

## Getting started

```bash
npm install
cp .env.example .env.local   # then fill in the keys (see below)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The site runs without any keys; backend
features switch on as you add them.

## Environment variables

Every variable is listed and explained in [.env.example](.env.example). Put real values in
`.env.local`, which git ignores. They're validated on first use by [lib/env.ts](lib/env.ts) (public)
and [lib/env.server.ts](lib/env.server.ts) (secrets), which throw one error listing whatever is missing.

| Variable | Where to find it | Exposed to browser |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Your public origin | yes |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API Keys | yes |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Same page, publishable (or legacy anon) key | yes |
| `SUPABASE_SECRET_KEY` | Same page, secret (or legacy service_role) key | **no** |
| `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` | Paystack → Settings → API Keys & Webhooks | yes |
| `PAYSTACK_SECRET_KEY` | Same page. Checkout and refunds need it; see [supabase/README.md → Payments](supabase/README.md#payments-paystack) | **no** |

Add the same variables in your hosting provider's settings when you deploy.

## Backend layout

| Path | What it's for |
| --- | --- |
| [lib/dal.ts](lib/dal.ts) | Who's signed in, their role, plan, status and affiliate status; `requireViewer` / `requireAdmin` / `requireAffiliate` guards |
| [lib/db/](lib/db/) | Public reads (published courses, posts, challenges, instructors, settings, reviews), cached and refreshed on save |
| [lib/db/studio/](lib/db/studio/) | Studio reads (drafts, students, payments, affiliates…) with the admin's session |
| [lib/studio-action.ts](lib/studio-action.ts) | `adminAction()`: every studio Server Action checks admin, saves, refreshes the site, reports errors |
| [lib/studio-store.ts](lib/studio-store.ts) | `useServerCollection()`: optimistic studio lists backed by Server Actions, plus the error banner |
| `app/(studio)/studio/*/actions.ts` | Studio Server Actions (courses, blog, challenges, students, earnings, affiliates, settings, media, reviews, feedback…) |
| [lib/markdown.ts](lib/markdown.ts) | The Markdown the blog editor writes ↔ article blocks |
| [lib/supabase/server.ts](lib/supabase/server.ts) | Supabase as the signed-in user, in Server Components, Server Actions and Route Handlers |
| [lib/supabase/client.ts](lib/supabase/client.ts) | Supabase as the signed-in user, in client components |
| [lib/supabase/admin.ts](lib/supabase/admin.ts) | Secret-key client that bypasses RLS. Webhooks and deleting logins only |
| [lib/supabase/database.types.ts](lib/supabase/database.types.ts) | DB types generated from the migrations. `npm run db:types` regenerates them once linked |
| [app/(learn)/courses/actions.ts](app/(learn)/courses/actions.ts) | The course player: `openLesson()` (video only for students whose plan includes it), progress, reviews |
| [lib/checkout.server.ts](lib/checkout.server.ts) | Prices an order: plan, upgrade credit, promo or affiliate code, which affiliate earns the commission |
| [app/(site)/checkout/](app/(site)/checkout/) | `/checkout` (order summary, codes, Pay), `/checkout/complete` (confirms with Paystack) |
| [lib/db/affiliate-portal.ts](lib/db/affiliate-portal.ts) | The affiliate's own dashboard numbers: referred sales, clicks, sign-ups, links, payouts |
| [app/(affiliate)/affiliate/actions.ts](app/(affiliate)/affiliate/actions.ts) | What affiliates change: tracking links, payout method, tax details, code requests |
| [lib/store.ts](lib/store.ts), [lib/db/store.ts](lib/db/store.ts) | The store: resource types, categories, formatting; the published resources for /store |
| [app/api/store/download/route.ts](app/api/store/download/route.ts) | Store downloads: checks access with `store_download()`, then one file or a streamed ZIP |
| [proxy.ts](proxy.ts) | Refreshes the session, protects private areas (and checkout), records `?ref=CODE&sub=…` affiliate clicks |
| [app/auth/callback/route.ts](app/auth/callback/route.ts) | Return URL for Google sign-in and email links; credits affiliate referrals |
| [lib/paystack.ts](lib/paystack.ts) | Paystack API: start and verify payments, refunds, webhook signature check |
| [app/api/webhooks/paystack/route.ts](app/api/webhooks/paystack/route.ts) | Paystack webhook: records payments even if the buyer closes the tab |
| [supabase/](supabase/) | All SQL: migrations, diagnostics and scripts |

Everything the site shows lives in Supabase: content (courses, lessons, blog, challenges,
instructors, settings), students (plans, enrollments, progress, reviews, mixes, challenge entries,
email preferences), sales (checkout orders, payments, promo codes, refunds) and the affiliate program
(applications, clicks, sign-ups, commission, payouts, tracking links) and the store (downloadable
resources, files, download counts). Anyone can browse courses and the store;
playing a lesson or downloading a file needs an account, and the database only hands out videos and
files to people whose plan includes them (or for free-preview lessons and free downloads).

## Database

All SQL lives in [supabase/](supabase/): migrations to build the database, diagnostics to inspect it,
and scripts for admin jobs. [supabase/README.md](supabase/README.md) has the run order, the
first-time setup, which studio page uses which table, and a troubleshooting table.

## Scripts

| Script | Does |
| --- | --- |
| `npm run dev` / `build` / `start` | Next.js |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript with no emit |
| `npm run db:*` | Supabase CLI shortcuts: `db:push`, `db:migration`, `db:types` (see [supabase/README.md](supabase/README.md)) |
