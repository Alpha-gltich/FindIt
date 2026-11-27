-- FindIt migration: hide flagged reports from public browsing.
-- Owners and admins still see their reports. Requires 20261127_report_flags.sql.

create or replace function public.can_view_report(report_id uuid)
returns boolean
language sql
security definer
set search_path = ''
as $$
  select
    not exists (
      select 1
      from public.report_flags
      where report_flags.report_id = can_view_report.report_id
    )
    or exists (
      select 1
      from public.admin_users
      where admin_users.user_id = (select auth.uid())
    )
    or exists (
      select 1
      from public.reports
      where reports.id = can_view_report.report_id
        and reports.user_id = (select auth.uid())
    );
$$;

revoke all on function public.can_view_report(uuid) from public;
grant execute on function public.can_view_report(uuid) to anon, authenticated;

drop policy if exists "Hide flagged reports from public" on public.reports;

create policy "Hide flagged reports from public"
on public.reports
as restrictive
for select
to anon, authenticated
using (public.can_view_report(id));

-- Verification:
-- Expected: one restrictive SELECT policy named "Hide flagged reports from public".
select policyname, cmd, roles, permissive, qual
from pg_policies
where schemaname = 'public'
  and tablename = 'reports'
  and policyname = 'Hide flagged reports from public';

notify pgrst, 'reload schema';
