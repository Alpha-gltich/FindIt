-- FindIt migration: let signed-in users flag abusive or incorrect reports.
-- Flagged reports are hidden from public Browse by 20261127_hide_flagged_reports.sql.
-- Admins can clear flags; every clear is written to an append-only audit table.

create table if not exists public.report_flags (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.reports(id) on delete cascade,
  reporter_id uuid not null references auth.users(id) on delete cascade,
  reason text not null check (reason in ('spam', 'fraud', 'inappropriate', 'other')),
  created_at timestamptz not null default now(),
  unique (report_id, reporter_id)
);

create index if not exists report_flags_report_id_idx
on public.report_flags (report_id);

create index if not exists report_flags_created_at_idx
on public.report_flags (created_at desc);

alter table public.report_flags enable row level security;

revoke all on public.report_flags from public, anon;
grant select, insert, delete on public.report_flags to authenticated;

drop policy if exists "Users can flag a report once" on public.report_flags;
create policy "Users can flag a report once"
on public.report_flags
for insert
to authenticated
with check (reporter_id = (select auth.uid()));

drop policy if exists "Users can view own report flags" on public.report_flags;
create policy "Users can view own report flags"
on public.report_flags
for select
to authenticated
using (reporter_id = (select auth.uid()));

drop policy if exists "Admins can view report flags" on public.report_flags;
create policy "Admins can view report flags"
on public.report_flags
for select
to authenticated
using (public.is_admin());

drop policy if exists "Admins can clear report flags" on public.report_flags;
create policy "Admins can clear report flags"
on public.report_flags
for delete
to authenticated
using (public.is_admin());

create table if not exists public.report_flag_clear_audit (
  id uuid primary key default gen_random_uuid(),
  admin_user_id uuid not null,
  report_id uuid not null,
  cleared_count integer not null check (cleared_count > 0),
  created_at timestamptz not null default now()
);

create index if not exists report_flag_clear_audit_created_at_idx
on public.report_flag_clear_audit (created_at desc);

create index if not exists report_flag_clear_audit_report_id_idx
on public.report_flag_clear_audit (report_id);

alter table public.report_flag_clear_audit enable row level security;

revoke all on public.report_flag_clear_audit from public, anon;
grant select, insert on public.report_flag_clear_audit to authenticated;

drop policy if exists "Admins can log flag clears" on public.report_flag_clear_audit;
create policy "Admins can log flag clears"
on public.report_flag_clear_audit
for insert
to authenticated
with check (
  admin_user_id = (select auth.uid())
  and public.is_admin()
);

drop policy if exists "Admins can view flag-clear log" on public.report_flag_clear_audit;
create policy "Admins can view flag-clear log"
on public.report_flag_clear_audit
for select
to authenticated
using (public.is_admin());

-- Verification:
-- Expected report_flags: RLS enabled, four SELECT/INSERT/DELETE policies, no UPDATE grant.
-- Expected report_flag_clear_audit: RLS enabled, two SELECT/INSERT policies, no UPDATE or DELETE grants.
select rowsecurity
from pg_tables
where schemaname = 'public'
  and tablename in ('report_flags', 'report_flag_clear_audit')
order by tablename;

select tablename, policyname, cmd, roles, qual, with_check
from pg_policies
where schemaname = 'public'
  and tablename in ('report_flags', 'report_flag_clear_audit')
order by tablename, cmd, policyname;

select table_name, grantee, privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name in ('report_flags', 'report_flag_clear_audit')
order by table_name, grantee, privilege_type;
