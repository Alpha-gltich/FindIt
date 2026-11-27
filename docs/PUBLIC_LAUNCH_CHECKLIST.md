# FindIt public launch checklist

Date: 27 November 2026

## Current status

The app, RLS policies, storage rules, deployed headers, and email confirmation are working. The items below are still required before treating FindIt as ready for hundreds of uncontrolled public users.

## You must do these in the Supabase dashboard

1. **Upgrade the Supabase project to Pro or higher.**
   - Open Supabase dashboard → project settings → billing.
   - This is required for predictable database/API capacity and stronger auth controls.
   - Record the upgrade date here: ______________

2. **Set up custom SMTP for auth emails.**
   - Open Authentication → Settings → SMTP Settings.
   - Use your own email provider credentials.
   - Send a test email from the dashboard.
   - Record the provider and test date here: ______________

3. **Enable CAPTCHA on signup and login.**
   - Open Authentication → Settings → CAPTCHA.
   - Use Cloudflare Turnstile or hCaptcha.
   - Add the site key in Supabase and keep the secret key only in Supabase.
   - Record the provider and test date here: ______________

4. **Replace the default auth email rate limits if needed.**
   - Review Authentication → Settings → Rate Limits after SMTP is configured.
   - Set signup and password-reset limits high enough for the expected test volume, but low enough to slow abuse.

5. **Back up the database and storage.**
   - Use the Supabase backup settings or an exported SQL dump plus a storage backup.
   - Test that a restore process exists.
   - Record the last backup date here: ______________

6. **Bootstrap the admin account.**
   - Register the real staff email first.
   - Run this in the SQL Editor:

```sql
insert into public.admin_users (user_id)
select id from auth.users where email = 'STAFF_EMAIL_HERE'
on conflict (user_id) do nothing;
```

7. **Apply the new hardening migrations in this order.**
   - Run `supabase/migrations/20261127_abuse_limits_preflight.sql`.
   - Continue only if every `bad_users` value is `0`.
   - Run `supabase/migrations/20261127_abuse_limits.sql`.
   - Run `supabase/migrations/20261127_admin_storage_delete.sql`.
   - Run `supabase/migrations/20261127_contact_reveal_audit.sql`.
   - Run `supabase/migrations/20261127_report_flags.sql`.
   - Run `supabase/migrations/20261127_hide_flagged_reports.sql`.
   - Run `supabase/migrations/20261127_audit_retention.sql`.

8. **Verify the new policies.**
   - Run Security Advisor and fix any new warnings.
   - Confirm anonymous users still cannot read `contact_info`, `admin_users`, or `account_deletion_requests`.
   - Confirm an admin can delete a test report and its photo.
   - Confirm an admin can clear a test flag and that `public.report_flag_clear_audit` gets one row.
   - Confirm a non-admin cannot delete `public.report_flags` or read either audit table.
   - Confirm `public.expire_old_audit_logs()` is not executable by `anon` or `authenticated`.
   - If pg_cron is available, confirm the `findit-expire-old-audit-logs` job exists.
   - Confirm pending deletion requests are not removed by the 180-day cleanup.

## You must do these outside the code

1. Put ownership, scope, price, deposit, and support responsibility in writing.
2. Keep all buyer-owned accounts in the buyer's name: Supabase, Vercel, GitHub, support email, and domain.
3. Have the Privacy Policy and Terms reviewed for your jurisdiction.
4. Replace the WhatsApp group placeholder in `src/constants/legal.ts` with the real buyer-provided link.
5. Do not promise uptime, 24/7 availability, guaranteed item recovery, or privacy from other signed-in users.

## What the app now does

- Compresses and downsamples picked photos before upload.
- Limits each user to 100 total reports and 20 reports per hour at the database level.
- Limits each user to 300 total photos and 20 photos per hour at the storage policy level.
- Lets signed-in users flag a report once; flagged reports disappear from public Browse but stay visible to owners and admins.
- Gives admins a moderation screen to view flagged reports, open them, clear flags, and delete reports plus attached photos.
- Keeps contact numbers hidden in the moderation list until an admin explicitly reveals one, and logs every reveal.
- Logs every flag clear with the admin, report, and number of flags cleared.
- Expires audit rows and resolved deletion requests after 180 days; pending deletion requests are retained.
- Runs type-check and web export in GitHub Actions on every push and pull request.

## Remaining caveats

- Supabase free-tier email delivery is not safe for hundreds of signups.
- Client-side compression reduces storage growth but does not replace a per-user storage quota.
- CAPTCHA, custom SMTP, and plan upgrades cannot be completed from this repository.
- Native production builds and store submission are out of scope.
