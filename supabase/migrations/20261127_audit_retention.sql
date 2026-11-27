-- FindIt migration: expire admin audit rows after 180 days.
-- Applies to contact_reveal_audit and report_flag_clear_audit.
-- The cleanup function is callable only by postgres/pg_cron, never by anon or authenticated clients.

create or replace function public.expire_old_audit_logs()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  deleted_count integer := 0;
begin
  with removed_reveals as (
    delete from public.contact_reveal_audit
    where created_at < now() - interval '180 days'
    returning 1
  ),
  removed_clears as (
    delete from public.report_flag_clear_audit
    where created_at < now() - interval '180 days'
    returning 1
  )
  select
    (select count(*) from removed_reveals) +
    (select count(*) from removed_clears)
  into deleted_count;

  return deleted_count;
end;
$$;

comment on function public.expire_old_audit_logs() is
  'Deletes FindIt admin audit rows older than 180 days. Intended for pg_cron/postgres only.';

revoke all on function public.expire_old_audit_logs() from public, anon, authenticated;
grant execute on function public.expire_old_audit_logs() to postgres;

-- Enable pg_cron when the platform allows it. If scheduling is unavailable,
-- an administrator can still run: select public.expire_old_audit_logs();
create schema if not exists extensions;

do $$
begin
  begin
    create extension if not exists pg_cron with schema extensions;
  exception when others then
    raise notice 'pg_cron could not be enabled: %. Use manual cleanup.', sqlerrm;
  end;

  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    begin
      perform cron.unschedule('findit-expire-old-audit-logs');
    exception when others then
      null;
    end;

    begin
      perform cron.schedule(
        'findit-expire-old-audit-logs',
        '17 3 * * *',
        'select public.expire_old_audit_logs();'
      );
    exception when others then
      raise notice 'Could not schedule pg_cron cleanup: %. Use manual cleanup.', sqlerrm;
    end;
  else
    raise notice 'pg_cron unavailable; run public.expire_old_audit_logs() manually.';
  end if;
end $$;

-- Verification:
-- Expected: security definer true, execute revoked from anon/authenticated.
select p.proname, p.prosecdef, p.proacl
from pg_proc p
where p.oid = 'public.expire_old_audit_logs()'::regprocedure;

-- Expected: scheduled once daily at 03:17 UTC if pg_cron is available.
select jobid, jobname, schedule, command
from cron.job
where jobname = 'findit-expire-old-audit-logs';

-- Expected: 0 after running `select public.expire_old_audit_logs();`.
select count(*) as old_reveals
from public.contact_reveal_audit
where created_at < now() - interval '180 days';

select count(*) as old_flag_clears
from public.report_flag_clear_audit
where created_at < now() - interval '180 days';
