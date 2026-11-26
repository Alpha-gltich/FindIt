-- FindIt migration: restrict report-photos access to the signed-in user's folder.
-- This replaces the broad "object" policy with narrow INSERT and DELETE policies.
-- It does not delete any files. Public photo URLs keep working without a SELECT policy.

drop policy if exists "object" on storage.objects;
drop policy if exists "Allow authenticated uploads to own folder" on storage.objects;
drop policy if exists "Users can delete own report photos" on storage.objects;

create policy "Allow authenticated uploads to own folder"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'report-photos'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "Users can delete own report photos"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'report-photos'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

-- Verification:
-- Expected: INSERT and DELETE policies only, both scoped to report-photos.
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
