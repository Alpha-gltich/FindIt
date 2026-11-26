-- FindIt migration: allow users to submit account deletion requests.
-- Requests are reviewed by an admin. This does not delete anything automatically.

create table if not exists public.account_deletion_requests (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  reason text,
  status text not null default 'pending' check (status in ('pending', 'completed', 'cancelled')),
  created_at timestamptz not null default now(),
  processed_at timestamptz
);

alter table public.account_deletion_requests enable row level security;

revoke all on public.account_deletion_requests from anon, authenticated;
grant select, insert, update on public.account_deletion_requests to authenticated;

create or replace function public.set_deletion_request_processed_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status is distinct from old.status and new.status <> 'pending' then
    new.processed_at := now();
  end if;
  return new;
end;
$$;

drop trigger if exists account_deletion_requests_processed_at on public.account_deletion_requests;

create trigger account_deletion_requests_processed_at
before update on public.account_deletion_requests
for each row
execute function public.set_deletion_request_processed_at();

drop policy if exists "Users can view own deletion request" on public.account_deletion_requests;
create policy "Users can view own deletion request"
on public.account_deletion_requests
for select
to authenticated
using (user_id = (select auth.uid()));

drop policy if exists "Users can request account deletion" on public.account_deletion_requests;
create policy "Users can request account deletion"
on public.account_deletion_requests
for insert
to authenticated
with check (
  user_id = (select auth.uid())
  and email = coalesce(auth.jwt() ->> 'email', '')
);

drop policy if exists "Admins can view deletion requests" on public.account_deletion_requests;
create policy "Admins can view deletion requests"
on public.account_deletion_requests
for select
to authenticated
using (public.is_admin());

drop policy if exists "Admins can update deletion requests" on public.account_deletion_requests;
create policy "Admins can update deletion requests"
on public.account_deletion_requests
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- Verification:
-- Expected: RLS enabled and five policies listed.
select rowsecurity from pg_tables
where schemaname = 'public' and tablename = 'account_deletion_requests';

select policyname, cmd, roles, qual, with_check
from pg_policies
where schemaname = 'public' and tablename = 'account_deletion_requests'
order by cmd, policyname;

-- Make the new table visible to PostgREST immediately.
notify pgrst, 'reload schema';
