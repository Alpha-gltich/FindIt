-- FindIt migration: stop public listing of report-photos.
-- The bucket remains public, so existing report photo URLs keep working.
-- This only removes the storage.objects SELECT policy that lets clients list files.

drop policy if exists "Anyone can view report photos" on storage.objects;

-- Verification:
-- Expected: no SELECT policy rows for report-photos.
select
  policyname,
  cmd,
  roles,
  qual,
  with_check
from pg_policies
where
  schemaname = 'storage'
  and tablename = 'objects'
  and (
    qual::text ilike '%report-photos%'
    or with_check::text ilike '%report-photos%'
  )
order by
  cmd,
  policyname;
