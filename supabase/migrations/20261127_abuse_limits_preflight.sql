-- Run before the abuse limits migration.
-- Every bad_users value must be 0 before continuing.

select
  'users_over_100_reports' as issue,
  count(*) as bad_users
from (
  select user_id
  from public.reports
  group by user_id
  having count(*) > 100
) over_limit

union all

select
  'users_over_20_reports_in_last_hour' as issue,
  count(*) as bad_users
from (
  select user_id
  from public.reports
  where created_at > now() - interval '1 hour'
  group by user_id
  having count(*) > 20
) recent_reports

union all

select
  'folders_over_300_photos' as issue,
  count(*) as bad_users
from (
  select (storage.foldername(name))[1] as folder
  from storage.objects
  where bucket_id = 'report-photos'
  group by folder
  having count(*) > 300
) folders;
