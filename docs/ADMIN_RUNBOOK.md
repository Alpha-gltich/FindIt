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

### 4. Apply the hardening migrations

Run these in the Supabase SQL Editor in this exact order:

1. `supabase/migrations/20261127_abuse_limits_preflight.sql`
2. Continue only if every `bad_users` value is `0`.
3. `supabase/migrations/20261127_abuse_limits.sql`
4. `supabase/migrations/20261127_admin_storage_delete.sql`
5. `supabase/migrations/20261127_contact_reveal_audit.sql`

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

### Recent reports for moderation

Use **Home → Admin Moderation** in the app. It shows the 50 newest reports, keeps contact numbers hidden until an admin taps **Reveal contact** on that report, logs each reveal, opens report details, and deletes a report plus its attached photo. A reveal is only shown after the audit-log write succeeds.

You can also review reports in SQL:

```sql
select id, user_id, type, item_name, status, location, created_at
from public.reports
order by created_at desc
limit 50;
```

### Contact reveal audit

```sql
select cra.created_at, u.email, cra.report_id
from public.contact_reveal_audit cra
left join auth.users u on u.id = cra.admin_user_id
order by cra.created_at desc
limit 50;
```

The app writes one row each time an admin reveals a contact number. If the write fails, the number is not revealed.

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
