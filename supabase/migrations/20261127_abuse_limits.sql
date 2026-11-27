-- FindIt migration: server-side abuse limits for reports and photo uploads.
-- Run only after 20261127_abuse_limits_preflight.sql returns 0 bad_users.

create or replace function public.enforce_report_limits()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (
    select count(*)
    from public.reports
    where user_id = new.user_id
  ) >= 100 then
    raise exception 'Report limit reached. Remove old reports before adding new ones.';
  end if;

  if (
    select count(*)
    from public.reports
    where user_id = new.user_id
      and created_at > now() - interval '1 hour'
  ) >= 20 then
    raise exception 'Too many reports submitted recently. Please slow down.';
  end if;

  return new;
end;
$$;

drop trigger if exists reports_abuse_limits on public.reports;

create trigger reports_abuse_limits
before insert on public.reports
for each row
execute function public.enforce_report_limits();

create or replace function public.can_upload_report_photo()
returns boolean
language sql
security definer
set search_path = ''
as $$
  select
    (
      select count(*)
      from storage.objects
      where bucket_id = 'report-photos'
        and (storage.foldername(name))[1] = (select auth.uid())::text
        and created_at > now() - interval '1 hour'
    ) < 20
    and
    (
      select count(*)
      from storage.objects
      where bucket_id = 'report-photos'
        and (storage.foldername(name))[1] = (select auth.uid())::text
    ) < 300;
$$;

revoke all on function public.can_upload_report_photo() from public, anon;
grant execute on function public.can_upload_report_photo() to authenticated;

drop policy if exists "Allow authenticated uploads to own folder" on storage.objects;

create policy "Allow authenticated uploads to own folder"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'report-photos'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and public.can_upload_report_photo()
);

-- Verification:
-- Expected: reports_abuse_limits trigger and upload policy present.
select tgname, tgrelid::regclass as table_name
from pg_trigger
where tgname = 'reports_abuse_limits' and not tgisinternal;

select policyname, cmd, with_check
from pg_policies
where schemaname = 'storage'
  and tablename = 'objects'
  and policyname = 'Allow authenticated uploads to own folder';

notify pgrst, 'reload schema';
