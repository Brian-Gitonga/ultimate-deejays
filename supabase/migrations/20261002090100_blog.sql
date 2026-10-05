-- ─────────────────────────────────────────────────────────────────────────────
-- 005 · Blog posts
--
-- Studio → Blog writes posts in Markdown. A post is public when its status is
-- published, or scheduled with a publish time that has passed. Scheduled posts
-- therefore go live on their own, with no job to run.
--
-- Requires 004 (instructors are the authors). Safe to re-run.
-- ─────────────────────────────────────────────────────────────────────────────

do $$ begin
  create type public.post_status as enum ('draft', 'scheduled', 'published');
exception when duplicate_object then null;
end $$;

create table if not exists public.blog_posts (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 100),
  title       text not null default '' check (char_length(title) <= 150),
  excerpt     text not null default '' check (char_length(excerpt) <= 400),
  body        text not null default '' check (char_length(body) <= 100000),
  category    text not null default '',
  keywords    text[] not null default '{}' check (cardinality(keywords) <= 20),
  cover       text not null default '',
  status      public.post_status not null default 'draft',
  publish_at  timestamptz not null default now(),
  author_id   uuid references public.instructors (id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table public.blog_posts is 'Blog posts. Body is Markdown (## headings, - lists, 1. lists, > quotes, **bold**, [links](/path)).';
comment on column public.blog_posts.publish_at is 'When the post goes (or went) live. Scheduled posts appear once this has passed.';

create index if not exists blog_posts_live_idx on public.blog_posts (status, publish_at desc);

drop trigger if exists blog_posts_set_updated_at on public.blog_posts;
create trigger blog_posts_set_updated_at
  before update on public.blog_posts
  for each row execute function public.set_updated_at();

alter table public.blog_posts enable row level security;

drop policy if exists "Anyone can read live posts" on public.blog_posts;
create policy "Anyone can read live posts"
  on public.blog_posts for select
  to anon, authenticated
  using (status <> 'draft' and publish_at <= now());

drop policy if exists "Admins manage posts" on public.blog_posts;
create policy "Admins manage posts"
  on public.blog_posts for all
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

revoke all on table public.blog_posts from anon, authenticated;
grant select on table public.blog_posts to anon, authenticated;
grant insert, update, delete on table public.blog_posts to authenticated;
