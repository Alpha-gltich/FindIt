-- FindIt migration: allow admins to remove report photos during moderation.
-- Requires 20261126_admin_role.sql, which creates public.is_admin().

drop policy if exists "Admins can delete report photos" on storage.objects;

create policy "Admins can delete report photos"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'report-photos'
  and public.is_admin()
);

-- Verification:
-- Expected: one admin DELETE policy plus the existing owner DELETE policy.
select
  policyname,
  cmd,
  roles,
  qual
from pg_policies
where
  schemaname = 'storage'
  and tablename = 'objects'
  and policyname = 'Admins can delete report photos';
