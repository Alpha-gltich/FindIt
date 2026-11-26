-- FindIt migration: enforce report field values and immutable ownership fields.
-- Run only after 20261126_reports_constraints_preflight.sql returns 0 bad rows.

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'reports_type_check'
      and conrelid = 'public.reports'::regclass
  ) then
    alter table public.reports
      add constraint reports_type_check
      check (type in ('lost', 'found'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'reports_status_check'
      and conrelid = 'public.reports'::regclass
  ) then
    alter table public.reports
      add constraint reports_status_check
      check (status in ('active', 'recovered'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'reports_item_name_length_check'
      and conrelid = 'public.reports'::regclass
  ) then
    alter table public.reports
      add constraint reports_item_name_length_check
      check (char_length(trim(item_name)) between 1 and 100);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'reports_description_length_check'
      and conrelid = 'public.reports'::regclass
  ) then
    alter table public.reports
      add constraint reports_description_length_check
      check (char_length(trim(description)) between 1 and 1000);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'reports_contact_info_length_check'
      and conrelid = 'public.reports'::regclass
  ) then
    alter table public.reports
      add constraint reports_contact_info_length_check
      check (contact_info is null or char_length(contact_info) <= 100);
  end if;
end $$;

create or replace function public.prevent_report_immutable_changes()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.user_id is distinct from old.user_id then
    raise exception 'user_id cannot be changed';
  end if;

  if new.created_at is distinct from old.created_at then
    raise exception 'created_at cannot be changed';
  end if;

  return new;
end;
$$;

drop trigger if exists reports_immutable_fields on public.reports;

create trigger reports_immutable_fields
before update on public.reports
for each row
execute function public.prevent_report_immutable_changes();

-- Verification:
-- Expected: five CHECK constraints listed.
select
  conname,
  pg_get_constraintdef(oid) as definition
from pg_constraint
where
  conrelid = 'public.reports'::regclass
  and contype = 'c'
order by conname;
