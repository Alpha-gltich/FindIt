-- FindIt Supabase security audit
-- Run these read-only queries in the Supabase SQL Editor.
-- They do not change data or settings.

-- 1. RLS status for all public app tables and storage.objects.
-- Expected: rowsecurity = true for every row.
select
  schemaname,
  tablename,
  rowsecurity
from pg_tables
where
  (schemaname = 'public')
  or (schemaname = 'storage' and tablename = 'objects')
order by
  schemaname,
  tablename;

-- 2. All policies on public app tables and storage.objects.
-- Check that no policy is broader than intended.
select
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
from pg_policies
where
  schemaname = 'public'
  or (schemaname = 'storage' and tablename = 'objects')
order by
  schemaname,
  tablename,
  policyname;

-- 3. Current RLS policies on reports, spelled out for quick verification.
-- Expected: public SELECT, authenticated INSERT with auth.uid() = user_id,
-- owner-only UPDATE and DELETE.
select
  policyname,
  roles,
  cmd,
  qual,
  with_check
from pg_policies
where
  schemaname = 'public'
  and tablename = 'reports'
order by policyname;

-- 4. Column privileges on reports.
-- Expected: anon can SELECT only the public columns, not contact_info.
select
  grantee,
  privilege_type,
  column_name
from information_schema.column_privileges
where
  table_schema = 'public'
  and table_name = 'reports'
order by
  grantee,
  column_name,
  privilege_type;
