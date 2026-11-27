-- Run this complete file once in Supabase Dashboard > SQL Editor.
create extension if not exists pgcrypto;

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  legacy_id text unique,
  title text not null check (char_length(title) between 1 and 160),
  kind text not null check (kind in ('pdf', 'prompt', 'image', 'link')),
  body text not null default '',
  file_url text,
  file_path text,
  cover_url text,
  cover_path text,
  external_url text,
  status text not null default 'draft' check (status in ('draft', 'published')),
  show_latest boolean not null default true,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  published_at timestamptz
);

create index if not exists posts_public_feed_idx
  on public.posts (published_at desc) where status = 'published';

alter table public.admin_users enable row level security;
alter table public.posts enable row level security;
revoke all on table public.admin_users from anon, authenticated;
revoke all on table public.posts from anon, authenticated;
grant select on table public.posts to anon, authenticated;
grant insert, update, delete on table public.posts to authenticated;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.admin_users
    where user_id = (select auth.uid())
  );
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

drop policy if exists "Published posts are public" on public.posts;
create policy "Published posts are public" on public.posts for select
to anon, authenticated using (status = 'published');
drop policy if exists "Admins can read every post" on public.posts;
create policy "Admins can read every post" on public.posts for select
to authenticated using ((select public.is_admin()));
drop policy if exists "Admins can create posts" on public.posts;
create policy "Admins can create posts" on public.posts for insert
to authenticated with check (
  (select public.is_admin()) and created_by = (select auth.uid())
);
drop policy if exists "Admins can update posts" on public.posts;
create policy "Admins can update posts" on public.posts for update
to authenticated using ((select public.is_admin()))
with check ((select public.is_admin()));
drop policy if exists "Admins can delete posts" on public.posts;
create policy "Admins can delete posts" on public.posts for delete
to authenticated using ((select public.is_admin()));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('guide-files', 'guide-files', true, 52428800, array['application/pdf', 'image/jpeg', 'image/png', 'image/webp']),
  ('guide-covers', 'guide-covers', true, 10485760, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public can read Washim Lab files" on storage.objects;
create policy "Public can read Washim Lab files" on storage.objects for select
to anon, authenticated using (bucket_id in ('guide-files', 'guide-covers'));
drop policy if exists "Admins can upload Washim Lab files" on storage.objects;
create policy "Admins can upload Washim Lab files" on storage.objects for insert
to authenticated with check (
  bucket_id in ('guide-files', 'guide-covers')
  and (select public.is_admin())
  and (storage.foldername(name))[1] = (select auth.uid())::text
);
drop policy if exists "Admins can update Washim Lab files" on storage.objects;
create policy "Admins can update Washim Lab files" on storage.objects for update
to authenticated using (
  bucket_id in ('guide-files', 'guide-covers') and (select public.is_admin())
  and (storage.foldername(name))[1] = (select auth.uid())::text
) with check (
  bucket_id in ('guide-files', 'guide-covers') and (select public.is_admin())
  and (storage.foldername(name))[1] = (select auth.uid())::text
);
drop policy if exists "Admins can delete Washim Lab files" on storage.objects;
create policy "Admins can delete Washim Lab files" on storage.objects for delete
to authenticated using (
  bucket_id in ('guide-files', 'guide-covers') and (select public.is_admin())
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

-- Authentication > Users-e account create korar por email-ta replace kore abar run korun.
insert into public.admin_users (user_id)
select id from auth.users where lower(email) = lower('YOUR_ADMIN_EMAIL')
on conflict (user_id) do nothing;
