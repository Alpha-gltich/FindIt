# FindIt admin runbook

Date: 27 November 2026

## Readiness verdict

The web app is functional, RLS-protected, and ready for a **controlled pilot**. I would not call it ready for an uncontrolled public launch with hundreds of users yet.

Vercel can serve the static SPA at that scale. The likely bottlenecks are Supabase Auth email delivery, database/API limits on the Free plan, storage growth, and abuse/moderation.

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
- A moderation process for fraudulent or abusive reports.
- Per-user upload limits or photo compression; currently the bucket allows 5 MB per file with no per-user quota.
- Backups and an incident contact.
- Legal review of the Privacy Policy and Terms.

## Immediate admin setup

### 1. Bootstrap an admin user

After confirming the staff email already registered in FindIt, run this in the Supabase SQL Editor:

```sql
insert into public.admin_users (user_id)
select id from auth.users where email = 'STAFF_EMAIL_HERE'
on conflict (user_id) do nothing;
```

Replace `STAFF_EMAIL_HERE` with the real registered admin email.

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

### Recent reports for moderation

```sql
select id, user_id, type, item_name, status, location, created_at
from public.reports
order by created_at desc
limit 50;
```

Delete abusive reports in the Supabase SQL Editor or use the owner/admin apps where available.

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
4. Watch Storage usage; large photos can consume the free allowance quickly.
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
