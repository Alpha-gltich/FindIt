-- FindIt migration: immutable audit log for admin contact reveals.
-- Requires 20261126_admin_role.sql, which creates public.is_admin().

create table if not exists public.contact_reveal_audit (
  id uuid primary key default gen_random_uuid(),
  admin_user_id uuid not null,
  report_id uuid not null,
  created_at timestamptz not null default now()
);

create index if not exists contact_reveal_audit_created_at_idx
on public.contact_reveal_audit (created_at desc);

create index if not exists contact_reveal_audit_report_id_idx
on public.contact_reveal_audit (report_id);

alter table public.contact_reveal_audit enable row level security;

revoke all on public.contact_reveal_audit from public, anon;
grant select, insert on public.contact_reveal_audit to authenticated;

drop policy if exists "Admins can log contact reveals" on public.contact_reveal_audit;
create policy "Admins can log contact reveals"
on public.contact_reveal_audit
for insert
to authenticated
with check (
  admin_user_id = (select auth.uid())
  and public.is_admin()
);

drop policy if exists "Admins can view contact reveal log" on public.contact_reveal_audit;
create policy "Admins can view contact reveal log"
on public.contact_reveal_audit
for select
to authenticated
using (public.is_admin());

-- Verification:
-- Expected: RLS enabled, two policies, and no UPDATE or DELETE grants.
select rowsecurity
from pg_tables
where schemaname = 'public' and tablename = 'contact_reveal_audit';

select policyname, cmd, roles, qual, with_check
from pg_policies
where schemaname = 'public' and tablename = 'contact_reveal_audit'
order by cmd, policyname;

select grantee, privilege_type
from information_schema.role_table_grants
where table_schema = 'public' and table_name = 'contact_reveal_audit'
order by grantee, privilege_type;
