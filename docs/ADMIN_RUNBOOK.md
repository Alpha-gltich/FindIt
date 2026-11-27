# FindIt admin runbook

Date: 27 November 2026

## Readiness verdict

The web app is functional, RLS-protected, and ready for a **controlled pilot**. I would not call it ready for an uncontrolled public launch with hundreds of users yet.

Vercel can serve the static SPA at that scale. The remaining bottlenecks are Supabase Auth email delivery, database/API limits on the Free plan, storage growth, and abuse/moderation.

### Safe enough for a controlled pilot if

- participants are invited or supervised;
- you monitor the support inbox during the test;
- you check Supabase Health/Auth logs during the test;
- you are ready to pause registrations if email delivery slows;
- you delete test accounts afterwards.

### Required before an uncontrolled public launch

- Custom SMTP for Supabase Auth emails. Default email limits can throttle signup and reset emails.
- CAPTCHA on signup/login, with the secret kept server-side.
- Supabase Pro or higher for stronger password/rate-limit controls and predictable capacity.
- Use the in-app admin moderation screen for fraudulent or abusive reports.
- Apply the report/upload abuse-limit migrations before the test.
- Backups and an incident contact.
- Legal review of the Privacy Policy and Terms.

The complete dashboard-only checklist is in `docs/PUBLIC_LAUNCH_CHECKLIST.md`.

## Immediate admin setup

### 1. Bootstrap an admin user

The designated admin email is `theogodwin2509@gmail.com`. After confirming it has registered in FindIt, run this in the Supabase SQL Editor:

```sql
insert into public.admin_users (user_id)
select id from auth.users where email = 'theogodwin2509@gmail.com'
on conflict (user_id) do nothing;
```

If the verification query returns no row, the account has not registered yet; register it first, then rerun the SQL.

### 2. Confirm admin membership

```sql
select au.user_id, u.email, au.created_at
from public.admin_users au
join auth.users u on u.id = au.user_id
order by au.created_at desc;
```

### 3. Confirm deletion-request table is active

```sql
select rowsecurity
from pg_tables
where schemaname = 'public' and tablename = 'account_deletion_requests';
```

Expected: `rowsecurity = true`.

### 4. Apply the hardening migrations

Run these in the Supabase SQL Editor in this exact order:

1. `supabase/migrations/20261127_abuse_limits_preflight.sql`
2. Continue only if every `bad_users` value is `0`.
3. `supabase/migrations/20261127_abuse_limits.sql`
4. `supabase/migrations/20261127_admin_storage_delete.sql`
5. `supabase/migrations/20261127_contact_reveal_audit.sql`
6. `supabase/migrations/20261127_report_flags.sql`
7. `supabase/migrations/20261127_hide_flagged_reports.sql`
8. `supabase/migrations/20261127_audit_retention.sql`

Then run **Database → Security Advisor** and fix any new warnings.

## Daily admin checks

### Pending deletion requests

```sql
select user_id, email, reason, status, created_at
from public.account_deletion_requests
where status = 'pending'
order by created_at;
```

To complete one after removing or anonymising the user's data:

```sql
update public.account_deletion_requests
set status = 'completed'
where user_id = 'USER_ID_HERE' and status = 'pending';
```

Delete the auth user through **Authentication → Users** in the Supabase dashboard. Do not add a `service_role` key to the app.

Pending requests are never expired. Completed and cancelled requests are removed after 180 days by the retention cleanup.

Use **Admin Moderation → Deletion requests** to review pending requests in the app. Mark a request **Complete** only after reviewing and removing the user's data, then delete the auth user through **Authentication → Users** in the Supabase dashboard. The app cannot delete auth users because it has no `service_role` key. **Cancel request** is available when a request should not be completed.

### Recent reports for moderation

Use **Home → Admin Moderation** in the app. It shows the 50 newest reports, flag counts, contact numbers hidden until an admin taps **Reveal contact**, report details, **Clear flags**, and deletion of a report plus its attached photo. It also links to **Audit log** and **Deletion requests**. A reveal is only shown after the audit-log write succeeds. A flag clear is only applied after its audit row is written. Flagged reports are hidden from public Browse but remain visible to owners and admins.

You can also review reports in SQL:

```sql
select id, user_id, type, item_name, status, location, created_at
from public.reports
order by created_at desc
limit 50;
```

### Flagged reports

```sql
select rf.created_at, rf.reason, r.item_name, r.location
from public.report_flags rf
join public.reports r on r.id = rf.report_id
order by rf.created_at desc
limit 50;
```

Flagged reports are hidden from Browse for non-owners and non-admins by the restrictive RLS policy in `20261127_hide_flagged_reports.sql`. To restore a report to Browse, use **Clear flags** in Admin Moderation, or delete the rows as an admin in SQL. Clear only after reviewing the report.

### Admin audit log

Use **Admin Moderation → Audit log** in the app. It has two tabs:

- **Contact reveals** — who revealed a contact number and when.
- **Flag clears** — who cleared flags, which report, and how many flags were cleared.

You can also review both tables in SQL:

```sql
select cra.created_at, u.email, cra.report_id
from public.contact_reveal_audit cra
left join auth.users u on u.id = cra.admin_user_id
order by cra.created_at desc
limit 50;

select fca.created_at, u.email, fca.report_id, fca.cleared_count
from public.report_flag_clear_audit fca
left join auth.users u on u.id = fca.admin_user_id
order by fca.created_at desc
limit 50;
```

The app writes these rows before allowing the action. If the write fails, the reveal or flag clear is blocked.

### Audit retention

Audit rows and resolved deletion requests expire after **180 days**. Pending deletion requests are kept until an admin handles them.

If pg_cron is enabled, the migration schedules a daily cleanup at **03:17 UTC** named `findit-expire-old-audit-logs`. Check it safely with this query, which will not fail when pg_cron is unavailable:

```sql
do $$
declare
  j record;
begin
  if to_regclass('cron.job') is not null then
    for j in
      select jobid, jobname, schedule, command
      from cron.job
      where jobname = 'findit-expire-old-audit-logs'
    loop
      raise notice 'pg_cron job: % | % | % | %', j.jobid, j.jobname, j.schedule, j.command;
    end loop;
  else
    raise notice 'pg_cron job table unavailable; run public.expire_old_audit_logs() manually.';
  end if;
end $$;
```

If pg_cron is unavailable, run cleanup manually when needed:

```sql
select public.expire_old_audit_logs();
```

Only `postgres` is allowed to execute the cleanup function. Anon and authenticated clients cannot call it.

### Recent storage objects

```sql
select name, owner, created_at, updated_at, metadata
from storage.objects
where bucket_id = 'report-photos'
order by created_at desc
limit 50;
```

Check for orphaned files after deleting reports. Delete only files you have verified are no longer referenced by `public.reports.photo_url`.

### Auth health

In the Supabase dashboard, check:

- **Authentication → Users** for unexpected signups;
- **Logs → Auth Logs** for failed logins, throttling, or unusual spikes;
- **Database → Security Advisor** after any schema change;
- project usage for database size, storage size, and API traffic.

## During a large test

1. Start with 10–20 users, then scale up only if signup emails arrive quickly.
2. Watch the support inbox `findit.support00@gmail.com`.
3. Watch Supabase Auth logs for throttling or email errors.
4. Watch Storage usage; compression reduces growth but hundreds of photos still add up.
5. Keep a simple incident note: time, affected users, error message, action taken.

## After the test

1. Delete test accounts from **Authentication → Users**.
2. Delete test reports and their stored photos.
3. Re-run the anonymous access checks in `docs/PRE_DEPLOY_SECURITY_CHECK.md`.
4. Re-run **Security Advisor**.
5. Record what broke, what was slow, and any user-reported issues.

## Do not promise

- uptime or 24/7 availability;
- guaranteed response times;
- that lost items will be recovered;
- that contact details are private from other signed-in users;
- that the current Free-tier setup will handle arbitrary traffic.
