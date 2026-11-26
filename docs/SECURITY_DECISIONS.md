# FindIt security decisions

## Client key

`src/services/supabase.ts` contains only the public anon key. Row Level Security is the access control boundary. No `service_role` key may be added to this repository.

## Web sessions

`supabase-js` stores the session in browser `localStorage` because FindIt is a static SPA with no server layer. There are no httpOnly session cookies in this architecture.

Mitigations:

- Strict Content-Security-Policy in `vercel.json`.
- No `dangerouslySetInnerHTML`; React escapes user content.
- No raw SQL in the client; Supabase client/PostgREST only.
- Search terms are sanitised before being placed in a PostgREST filter.

A cookie-based session would require an Edge Function or similar server layer. Revisit only if the SPA architecture changes.

## Passwords

Password strength is enforced client-side at 8 characters minimum. Supabase's leaked-password protection and server-side password rules are unavailable on the Free plan; enable them after upgrading to Pro.

## Storage

`report-photos` stays public so existing image URLs keep working. The broad `SELECT` policy was removed to prevent listing. Uploads are restricted with an `INSERT` policy that requires the path to start with the signed-in user's ID. An owner-only `DELETE` policy allows cleanup; there is no `UPDATE` policy.

## Contact info access verification

On 26 November 2026, a read-only anonymous Supabase REST request for `reports?select=contact_info&limit=1` returned HTTP 401, while the same anonymous client could select `id` from `public.reports`. This confirms that the public anon key does not expose `contact_info`; database column permissions block it.

Signed-in users can fetch `contact_info` on a report detail screen. This is intentional so they can follow up about a matched item. Users should not enter contact details they are unwilling to share with other signed-in users.

To re-check after any schema change, run Query 4 in `supabase/security_audit.sql` and repeat the anonymous request described above.

## Deferred items

These need account-level access or a paid plan:

- Custom SMTP for auth emails.
- CAPTCHA for signup/login; the secret must stay server-side.
- Supabase Auth Site URL and Redirect URLs for the deployed domain.
- Auth rate-limit tuning.
- Leaked-password protection and server-side password rules.
