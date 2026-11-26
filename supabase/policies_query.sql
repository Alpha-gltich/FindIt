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
  cmd,
  policyname;
