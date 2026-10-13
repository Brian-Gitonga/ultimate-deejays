-- ─────────────────────────────────────────────────────────────────────────────
-- 016 · Template edits and plan allowances
--
-- plan_allowances        how many store downloads and edit requests each plan
--                        gets, every month or in total, and how many requests
--                        can wait at once (Studio → Settings → Pricing page).
--                        Empty = unlimited. Admins have no limits.
-- store_resources        + edits_enabled, edit_form, edit_turnaround: a
--                        template can offer edits, with its own request form
--                        (Studio → Store).
-- edit_requests          a member's request: their answers to the form, its
--                        status, and the edited files once they're delivered.
-- edit_request_messages  questions from the team and the member's replies.
-- the "edits" bucket     (private) files members attach (a logo, a photo)
--                        and the edited files the team delivers.
-- my_allowance()         what the signed-in member has used and has left.
-- store_download()       now also checks the download allowance.
-- request_edit(), cancel_edit_request(), reply_edit_request(),
-- mark_edit_seen()       how members create, cancel, answer and open requests.
-- studio_edit_requests() the studio's list, with the team's private notes.
-- profiles.phone         for "your edit is ready" text messages.
-- coupons.emails         a code can be limited to certain people.
--
-- How allowances count:
--   downloads  different templates downloaded in the period (downloading
--              the same one again in the same period is free)
--   edits      requests made in the period, except declined or cancelled
--              ones (those give the edit back)
--   a "month" is the calendar month (UTC); "total" never resets.
--
-- Requires 001–015. Safe to re-run.
-- ─────────────────────────────────────────────────────────────────────────────

-- Phone numbers ─────────────────────────────────────────────────────────────
-- International format (+254712345678), or empty.

alter table public.profiles add column if not exists phone text not null default '';

do $$ begin
  alter table public.profiles add constraint profiles_phone_check check (phone ~ '^(\+[1-9][0-9]{6,14})?$');
exception when duplicate_object then null;
end $$;

grant update (phone) on table public.profiles to authenticated;

-- Plan allowances ───────────────────────────────────────────────────────────

create table if not exists public.plan_allowances (
  plan       public.plan_tier primary key,
  downloads  integer check (downloads is null or downloads >= 0),
  edits      integer check (edits is null or edits >= 0),
  open_edits integer check (open_edits is null or open_edits >= 1),
  period     text not null default 'month' check (period in ('month', 'total')),
  updated_at timestamptz not null default now()
);

comment on table public.plan_allowances is 'Studio → Settings → Pricing page. Null = unlimited. Admins have no limits.';
comment on column public.plan_allowances.downloads is 'Different store templates downloaded per period.';
comment on column public.plan_allowances.edits is 'Edit requests per period (declined and cancelled ones don''t count).';
comment on column public.plan_allowances.open_edits is 'Edit requests that can be waiting at the same time.';
comment on column public.plan_allowances.period is 'month = resets on the 1st (UTC); total = never resets.';

insert into public.plan_allowances (plan, downloads, edits, open_edits, period) values
  ('warm-up', 5, 0, null, 'month'),
  ('resident', 30, 3, 2, 'month'),
  ('headliner', null, null, 3, 'month')
on conflict (plan) do nothing;

drop trigger if exists plan_allowances_set_updated_at on public.plan_allowances;
create trigger plan_allowances_set_updated_at
  before update on public.plan_allowances
  for each row execute function public.set_updated_at();

alter table public.plan_allowances enable row level security;

drop policy if exists "Anyone can read plan allowances" on public.plan_allowances;
create policy "Anyone can read plan allowances"
  on public.plan_allowances for select to anon, authenticated
  using (true);

drop policy if exists "Admins change plan allowances" on public.plan_allowances;
create policy "Admins change plan allowances"
  on public.plan_allowances for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

revoke all on table public.plan_allowances from anon, authenticated;
grant select on table public.plan_allowances to anon, authenticated;
grant update (downloads, edits, open_edits, period) on table public.plan_allowances to authenticated;

-- When the current allowance period started.
create or replace function public.allowance_period_start(period text)
returns timestamptz
language sql
stable
set search_path = ''
as $$
  select case when period = 'total' then '-infinity'::timestamptz else date_trunc('month', now(), 'UTC') end;
$$;

-- Templates that can be edited ──────────────────────────────────────────────

alter table public.store_resources add column if not exists edits_enabled boolean not null default false;
alter table public.store_resources add column if not exists edit_form jsonb not null default '[]';
alter table public.store_resources add column if not exists edit_turnaround text not null default '';

do $$ begin
  -- CASE, because AND doesn't promise to check the type before counting.
  alter table public.store_resources add constraint store_resources_edit_form_check
    check (case when jsonb_typeof(edit_form) = 'array' then jsonb_array_length(edit_form) <= 30 else false end);
exception when duplicate_object then null;
end $$;

do $$ begin
  alter table public.store_resources add constraint store_resources_edit_turnaround_check check (char_length(edit_turnaround) <= 80);
exception when duplicate_object then null;
end $$;

comment on column public.store_resources.edit_form is
  'The edit request form: [{ "id", "label", "type": text|textarea|url|color|select|file, "required", "placeholder", "help", "options" }].';
comment on column public.store_resources.edit_turnaround is 'Shown on the form, e.g. "Delivered within 2 working days".';

grant insert (id, slug, title, description, category, thumbnail, preview_url, access_plan, instructor_id, status, featured, lower_third,
              edits_enabled, edit_form, edit_turnaround)
  on table public.store_resources to authenticated;
grant update (slug, title, description, category, thumbnail, preview_url, access_plan, instructor_id, status, featured, lower_third,
              edits_enabled, edit_form, edit_turnaround)
  on table public.store_resources to authenticated;

-- Edit requests ─────────────────────────────────────────────────────────────

create table if not exists public.edit_requests (
  id             uuid primary key default gen_random_uuid(),
  number         integer generated always as identity,
  user_id        uuid not null references public.profiles (id) on delete cascade,
  resource_id    uuid references public.store_resources (id) on delete set null,
  resource_slug  text not null default '',
  resource_title text not null default '' check (char_length(resource_title) <= 120),
  answers        jsonb not null default '[]' check (jsonb_typeof(answers) = 'array'),
  notes          text not null default '' check (char_length(notes) <= 2000),
  phone          text not null default '' check (phone ~ '^(\+[1-9][0-9]{6,14})?$'),
  text_me        boolean not null default false,
  status         text not null default 'submitted'
                 check (status in ('submitted', 'in_progress', 'needs_info', 'delivered', 'declined', 'cancelled')),
  admin_notes    text not null default '' check (char_length(admin_notes) <= 2000),
  files          jsonb not null default '[]' check (jsonb_typeof(files) = 'array'),
  delivered_at   timestamptz,
  seen_at        timestamptz,
  is_demo        boolean not null default false,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

comment on table public.edit_requests is 'Template edit requests. Members create them with request_edit(); the team works on them in Studio → Edit requests.';
comment on column public.edit_requests.answers is 'The form as filled in: [{ "id", "label", "type", "value" }]. File answers hold a path in the edits bucket.';
comment on column public.edit_requests.files is 'Delivered files: [{ "id", "name", "kind": storage|link, "path", "url", "size", "mime" }].';
comment on column public.edit_requests.admin_notes is 'The team''s private notes. Members can''t read this column.';
comment on column public.edit_requests.seen_at is 'When the member first opened the delivered edit (clears the "ready" badge).';

create index if not exists edit_requests_user_idx on public.edit_requests (user_id, created_at desc);
create index if not exists edit_requests_status_idx on public.edit_requests (status, created_at desc);

drop trigger if exists edit_requests_set_updated_at on public.edit_requests;
create trigger edit_requests_set_updated_at
  before update on public.edit_requests
  for each row execute function public.set_updated_at();

create table if not exists public.edit_request_messages (
  id         uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.edit_requests (id) on delete cascade,
  author     text not null check (author in ('member', 'team')),
  body       text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);

create index if not exists edit_request_messages_request_idx on public.edit_request_messages (request_id, created_at);

alter table public.edit_requests enable row level security;
alter table public.edit_request_messages enable row level security;

drop policy if exists "Members see their own edit requests" on public.edit_requests;
create policy "Members see their own edit requests"
  on public.edit_requests for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));

drop policy if exists "Admins manage edit requests" on public.edit_requests;
create policy "Admins manage edit requests"
  on public.edit_requests for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

drop policy if exists "Admins delete edit requests" on public.edit_requests;
create policy "Admins delete edit requests"
  on public.edit_requests for delete to authenticated
  using ((select public.is_admin()));

drop policy if exists "Members see messages on their requests" on public.edit_request_messages;
create policy "Members see messages on their requests"
  on public.edit_request_messages for select to authenticated
  using (
    (select public.is_admin())
    or exists (select 1 from public.edit_requests e where e.id = request_id and e.user_id = (select auth.uid()))
  );

drop policy if exists "The team writes messages" on public.edit_request_messages;
create policy "The team writes messages"
  on public.edit_request_messages for insert to authenticated
  with check ((select public.is_admin()) and author = 'team');

-- Members create, cancel and answer through the functions below; only the
-- team changes a request directly. Nobody but the team reads private notes.
revoke all on table public.edit_requests, public.edit_request_messages from anon, authenticated;
grant select (id, number, user_id, resource_id, resource_slug, resource_title, answers, notes, phone, text_me, status, files,
              delivered_at, seen_at, is_demo, created_at, updated_at)
  on table public.edit_requests to authenticated;
grant update (status, admin_notes, files, delivered_at) on table public.edit_requests to authenticated;
grant delete on table public.edit_requests to authenticated;
grant select, insert (request_id, author, body) on table public.edit_request_messages to authenticated;

-- my_allowance() ────────────────────────────────────────────────────────────
-- { plan, admin, period, resetsAt, downloads: { limit, used },
--   edits: { limit, used, open, openLimit } }; limit null = unlimited.

create or replace function public.my_allowance()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_user uuid := (select auth.uid());
  v_profile record;
  v_rule record;
  v_period text;
  v_start timestamptz;
begin
  if v_user is null then
    return null;
  end if;
  select p.plan, p.role into v_profile from public.profiles p where p.id = v_user;
  if v_profile.plan is null then
    return null;
  end if;

  if v_profile.role = 'admin' then
    return jsonb_build_object(
      'plan', v_profile.plan, 'admin', true, 'period', 'month', 'resetsAt', null,
      'downloads', jsonb_build_object('limit', null, 'used', 0),
      'edits', jsonb_build_object('limit', null, 'used', 0, 'open', 0, 'openLimit', null));
  end if;

  select a.downloads, a.edits, a.open_edits, a.period into v_rule from public.plan_allowances a where a.plan = v_profile.plan;
  v_period := coalesce(v_rule.period, 'month');
  v_start := public.allowance_period_start(v_period);

  return jsonb_build_object(
    'plan', v_profile.plan,
    'admin', false,
    'period', v_period,
    'resetsAt', case when v_period = 'month' then date_trunc('month', now(), 'UTC') + interval '1 month' end,
    'downloads', jsonb_build_object(
      'limit', v_rule.downloads,
      'used', (select count(distinct d.resource_id) from public.store_downloads d where d.user_id = v_user and d.created_at >= v_start)),
    'edits', jsonb_build_object(
      'limit', v_rule.edits,
      'used', (select count(*) from public.edit_requests e
               where e.user_id = v_user and e.created_at >= v_start and e.status not in ('declined', 'cancelled')),
      'open', (select count(*) from public.edit_requests e
               where e.user_id = v_user and e.status in ('submitted', 'in_progress', 'needs_info')),
      'openLimit', v_rule.open_edits));
end;
$$;

revoke execute on function public.my_allowance() from public, anon;
grant execute on function public.my_allowance() to authenticated;

-- store_download(): same as migration 014, plus the download allowance ──────
-- New status: { status: "limit", limit, used, period } once it's used up.

create or replace function public.store_download(resource_slug text, file_ids uuid[] default null)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := (select auth.uid());
  v_resource record;
  v_profile record;
  v_files jsonb;
  v_counted boolean;
  v_limit integer;
  v_period text;
  v_start timestamptz;
  v_used integer;
begin
  select r.id, r.slug, r.title, r.access_plan into v_resource
  from public.store_resources r
  where r.slug = resource_slug and r.status = 'published';
  if v_resource.id is null then
    return jsonb_build_object('status', 'not_found');
  end if;

  if v_user is null then
    return jsonb_build_object('status', 'signin');
  end if;

  select p.plan, p.role, p.status into v_profile from public.profiles p where p.id = v_user;
  if v_profile.status is null or v_profile.status = 'suspended' then
    return jsonb_build_object('status', 'signin');
  end if;

  if v_profile.role <> 'admin' and v_profile.plan < v_resource.access_plan then
    return jsonb_build_object('status', 'upgrade', 'plan', v_resource.access_plan);
  end if;

  -- The download allowance. Taking the same template again in the same period is free.
  if v_profile.role <> 'admin' then
    select a.downloads, coalesce(a.period, 'month') into v_limit, v_period from public.plan_allowances a where a.plan = v_profile.plan;
    if v_limit is not null then
      v_start := public.allowance_period_start(v_period);
      if not exists (
        select 1 from public.store_downloads d
        where d.user_id = v_user and d.resource_id = v_resource.id and d.created_at >= v_start
      ) then
        select count(distinct d.resource_id) into v_used
        from public.store_downloads d
        where d.user_id = v_user and d.created_at >= v_start;
        if v_used >= v_limit then
          return jsonb_build_object('status', 'limit', 'limit', v_limit, 'used', v_used, 'period', v_period);
        end if;
      end if;
    end if;
  end if;

  select coalesce(jsonb_agg(jsonb_build_object(
           'id', f.id, 'name', f.name, 'kind', f.kind, 'path', f.path, 'url', f.url, 'size', f.size_bytes, 'mime', f.mime_type
         ) order by f.position, f.created_at), '[]'::jsonb)
  into v_files
  from public.store_files f
  where f.resource_id = v_resource.id and (file_ids is null or f.id = any (file_ids));

  if jsonb_array_length(v_files) = 0 then
    return jsonb_build_object('status', 'not_found');
  end if;

  -- Admins checking a pack aren't counted.
  if v_profile.role <> 'admin' then
    v_counted := not exists (
      select 1 from public.store_downloads d
      where d.resource_id = v_resource.id and d.user_id = v_user and d.created_at > now() - interval '1 day'
    );
    insert into public.store_downloads (resource_id, user_id, files, counted)
    values (v_resource.id, v_user, jsonb_array_length(v_files), v_counted);
    if v_counted then
      update public.store_resources set download_count = download_count + 1 where id = v_resource.id;
    end if;
  end if;

  return jsonb_build_object('status', 'ok', 'slug', v_resource.slug, 'title', v_resource.title, 'files', v_files);
end;
$$;

revoke execute on function public.store_download(text, uuid[]) from public;
grant execute on function public.store_download(text, uuid[]) to anon, authenticated;

-- request_edit() ────────────────────────────────────────────────────────────
-- Returns { status: "ok", id, number } or { status: "signin" | "not_found" |
-- "upgrade" | "invalid" | "limit" | "busy", … }. The site checks the answers
-- against the template's form first; this checks who may ask, and how often.

create or replace function public.request_edit(
  resource_slug text,
  answers jsonb,
  notes text default '',
  phone text default '',
  text_me boolean default false
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := (select auth.uid());
  v_profile record;
  v_resource record;
  v_rule record;
  v_period text;
  v_start timestamptz;
  v_used integer;
  v_open integer;
  v_phone text := coalesce(trim(phone), '');
  v_id uuid;
  v_number integer;
begin
  if v_user is null then
    return jsonb_build_object('status', 'signin');
  end if;
  -- One request at a time per member, so two quick submits can't both slip under the limit.
  perform pg_advisory_xact_lock(hashtextextended(v_user::text, 16));

  select p.plan, p.role, p.status into v_profile from public.profiles p where p.id = v_user;
  if v_profile.status is null or v_profile.status = 'suspended' then
    return jsonb_build_object('status', 'signin');
  end if;

  select r.id, r.slug, r.title, r.access_plan, r.edits_enabled into v_resource
  from public.store_resources r
  where r.slug = resource_slug and r.status = 'published';
  if v_resource.id is null or not v_resource.edits_enabled then
    return jsonb_build_object('status', 'not_found');
  end if;

  if v_profile.role <> 'admin' and v_profile.plan < v_resource.access_plan then
    return jsonb_build_object('status', 'upgrade', 'plan', v_resource.access_plan);
  end if;

  if answers is null or jsonb_typeof(answers) <> 'array' or pg_column_size(answers) > 20000
     or char_length(coalesce(notes, '')) > 2000 or v_phone !~ '^(\+[1-9][0-9]{6,14})?$' then
    return jsonb_build_object('status', 'invalid');
  end if;

  if v_profile.role <> 'admin' then
    select a.edits, a.open_edits, a.period into v_rule from public.plan_allowances a where a.plan = v_profile.plan;
    v_period := coalesce(v_rule.period, 'month');
    v_start := public.allowance_period_start(v_period);
    if v_rule.edits is not null then
      select count(*) into v_used from public.edit_requests e
      where e.user_id = v_user and e.created_at >= v_start and e.status not in ('declined', 'cancelled');
      if v_used >= v_rule.edits then
        return jsonb_build_object('status', 'limit', 'limit', v_rule.edits, 'used', v_used, 'period', v_period);
      end if;
    end if;
    if v_rule.open_edits is not null then
      select count(*) into v_open from public.edit_requests e
      where e.user_id = v_user and e.status in ('submitted', 'in_progress', 'needs_info');
      if v_open >= v_rule.open_edits then
        return jsonb_build_object('status', 'busy', 'openLimit', v_rule.open_edits);
      end if;
    end if;
  end if;

  insert into public.edit_requests (user_id, resource_id, resource_slug, resource_title, answers, notes, phone, text_me)
  values (v_user, v_resource.id, v_resource.slug, v_resource.title, answers, coalesce(notes, ''), v_phone, coalesce(text_me, false) and v_phone <> '')
  returning id, number into v_id, v_number;

  -- Remember the number for next time.
  if v_phone <> '' then
    update public.profiles p set phone = v_phone where p.id = v_user and p.phone is distinct from v_phone;
  end if;

  return jsonb_build_object('status', 'ok', 'id', v_id, 'number', v_number);
end;
$$;

revoke execute on function public.request_edit(text, jsonb, text, text, boolean) from public, anon;
grant execute on function public.request_edit(text, jsonb, text, text, boolean) to authenticated;

-- A member cancels a request the team hasn't started.
create or replace function public.cancel_edit_request(request uuid)
returns boolean
language sql
security definer
set search_path = ''
as $$
  with changed as (
    update public.edit_requests set status = 'cancelled'
    where id = request and user_id = (select auth.uid()) and status in ('submitted', 'needs_info')
    returning 1
  )
  select exists (select 1 from changed);
$$;

revoke execute on function public.cancel_edit_request(uuid) from public, anon;
grant execute on function public.cancel_edit_request(uuid) to authenticated;

-- A member answers a question (or adds detail). Answering sends it back to the team's queue.
create or replace function public.reply_edit_request(request uuid, body text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  if char_length(trim(coalesce(body, ''))) not between 1 and 2000 then
    return false;
  end if;
  if not exists (
    select 1 from public.edit_requests e
    where e.id = request and e.user_id = (select auth.uid()) and e.status in ('submitted', 'in_progress', 'needs_info')
  ) then
    return false;
  end if;
  insert into public.edit_request_messages (request_id, author, body) values (request, 'member', trim(body));
  update public.edit_requests set status = case when status = 'needs_info' then 'submitted' else status end, updated_at = now()
  where id = request;
  return true;
end;
$$;

revoke execute on function public.reply_edit_request(uuid, text) from public, anon;
grant execute on function public.reply_edit_request(uuid, text) to authenticated;

-- Opening a delivered edit clears its "ready" badge.
create or replace function public.mark_edit_seen(request uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.edit_requests set seen_at = now()
  where id = request and user_id = (select auth.uid()) and status = 'delivered' and seen_at is null;
$$;

revoke execute on function public.mark_edit_seen(uuid) from public, anon;
grant execute on function public.mark_edit_seen(uuid) to authenticated;

-- studio_edit_requests(): every request with its member, for the studio ────

create or replace function public.studio_edit_requests(target uuid default null)
returns table (
  id uuid, number integer, user_id uuid, member_name text, member_email text, member_plan public.plan_tier,
  resource_id uuid, resource_slug text, resource_title text, resource_thumbnail text, resource_lower_third boolean,
  answers jsonb, notes text, phone text, text_me boolean, status text, admin_notes text, files jsonb,
  delivered_at timestamptz, seen_at timestamptz, is_demo boolean, created_at timestamptz, updated_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select e.id, e.number, e.user_id,
         coalesce(nullif(p.dj_name, ''), nullif(p.full_name, ''), p.email), p.email, p.plan,
         e.resource_id, e.resource_slug, e.resource_title, coalesce(r.thumbnail, ''), coalesce(r.lower_third, false),
         e.answers, e.notes, e.phone, e.text_me, e.status, e.admin_notes, e.files,
         e.delivered_at, e.seen_at, e.is_demo, e.created_at, e.updated_at
  from public.edit_requests e
  join public.profiles p on p.id = e.user_id
  left join public.store_resources r on r.id = e.resource_id
  where (select public.is_admin()) and (target is null or e.id = target)
  order by e.created_at desc;
$$;

revoke execute on function public.studio_edit_requests(uuid) from public, anon;
grant execute on function public.studio_edit_requests(uuid) to authenticated;

-- The edits bucket (private) ────────────────────────────────────────────────
--   uploads/<member id>/…     files members attach to a request (their logo)
--   delivered/<request id>/…  the edited files the team delivers
-- Members never read delivered files directly: the site signs a short-lived
-- link after checking the request is theirs.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('edits', 'edits', false, null, null)
on conflict (id) do update set public = false;

drop policy if exists "Members upload files for their edits" on storage.objects;
create policy "Members upload files for their edits"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'edits'
    and (storage.foldername(name))[1] = 'uploads'
    and (storage.foldername(name))[2] = (select auth.uid())::text
  );

drop policy if exists "Members see their own edit uploads" on storage.objects;
create policy "Members see their own edit uploads"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'edits'
    and (
      (select public.is_admin())
      or ((storage.foldername(name))[1] = 'uploads' and (storage.foldername(name))[2] = (select auth.uid())::text)
    )
  );

drop policy if exists "Members remove their own edit uploads" on storage.objects;
create policy "Members remove their own edit uploads"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'edits'
    and (
      (select public.is_admin())
      or ((storage.foldername(name))[1] = 'uploads' and (storage.foldername(name))[2] = (select auth.uid())::text)
    )
  );

drop policy if exists "Admins upload delivered edits" on storage.objects;
create policy "Admins upload delivered edits"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'edits' and (select public.is_admin()));

drop policy if exists "Admins replace edit files" on storage.objects;
create policy "Admins replace edit files"
  on storage.objects for update to authenticated
  using (bucket_id = 'edits' and (select public.is_admin()));

-- Studio → Notifications: new edit requests in the feed ─────────────────────

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
from public.mix_submissions m
union all
select 'edit:' || e.id, 'edit',
       coalesce(nullif(p.dj_name, ''), nullif(p.full_name, ''), p.email) || ' asked for an edit of ' || e.resource_title,
       'Request #' || e.number, '/studio/edits?request=' || e.id, e.created_at
from public.edit_requests e join public.profiles p on p.id = e.user_id;

revoke all on public.admin_activity from anon, authenticated;
grant select on public.admin_activity to authenticated;

-- Coupons for certain people ────────────────────────────────────────────────

alter table public.coupons add column if not exists emails text[] not null default '{}';
comment on column public.coupons.emails is 'Only these accounts (lower-case emails) can use the code. Empty = anyone.';

grant update (code, description, discount_type, discount_value, plans, max_redemptions, once_per_customer, starts_at, expires_at, active, emails)
  on table public.coupons to authenticated;
