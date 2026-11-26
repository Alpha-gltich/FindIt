-- Run this before the constraints migration.
-- Every bad_rows value must be 0 before continuing.

select
  'bad_type' as issue,
  count(*) as bad_rows
from public.reports
where type is null or type not in ('lost', 'found')

union all

select
  'bad_status' as issue,
  count(*) as bad_rows
from public.reports
where status is null or status not in ('active', 'recovered')

union all

select
  'item_name_too_long_or_empty' as issue,
  count(*) as bad_rows
from public.reports
where item_name is null or char_length(trim(item_name)) < 1 or char_length(trim(item_name)) > 100

union all

select
  'description_too_long_or_empty' as issue,
  count(*) as bad_rows
from public.reports
where description is null or char_length(trim(description)) < 1 or char_length(trim(description)) > 1000

union all

select
  'contact_info_too_long' as issue,
  count(*) as bad_rows
from public.reports
where contact_info is not null and char_length(contact_info) > 100;
