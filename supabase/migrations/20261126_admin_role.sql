-- FindIt migration: add a staff/admin role without using user_metadata.
-- Admin membership lives in public.admin_users, which is not editable by clients
-- except through policies that already require admin access.

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;

revoke all on public.admin_users from anon;
grant select, insert, update, delete on public.admin_users to authenticated;

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.admin_users
    where user_id = (select auth.uid())
  );
$$;

revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

drop policy if exists "Users can view own admin status" on public.admin_users;
create policy "Users can view own admin status"
on public.admin_users
for select
to authenticated
using (
  user_id = (select auth.uid())
  or public.is_admin()
);

drop policy if exists "Admins can manage admin users" on public.admin_users;
create policy "Admins can manage admin users"
on public.admin_users
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Admins can update reports" on public.reports;
create policy "Admins can update reports"
on public.reports
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Admins can delete reports" on public.reports;
create policy "Admins can delete reports"
on public.reports
for delete
to authenticated
using (public.is_admin());

-- Bootstrap example (run manually with the real staff email):
-- insert into public.admin_users (user_id)
-- select id from auth.users where email = 'staff@example.com'
-- on conflict (user_id) do nothing;

-- Verification:
select policyname, cmd, roles, qual, with_check
from pg_policies
where
  (schemaname = 'public' and tablename = 'admin_users')
  or (schemaname = 'public' and tablename = 'reports')
order by tablename, cmd, policyname;
