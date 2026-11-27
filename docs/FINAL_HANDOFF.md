# FindIt final handoff

## Live deployment

- Web app: https://findit-campus-ng.vercel.app
- Vercel project: `cpital-hub/findit-campus`
- Repository: `https://github.com/Alpha-gltich/FindIt.git`
- Production branch: `main`
- Latest hardening commit: `1fbc1b0` — `feat: complete security, legal and deployment hardening`

## Verified technical status

- TypeScript check passes: `npx tsc --noEmit`.
- Web export passes: `npx expo export -p web`.
- Live production URL returns `HTTP/1.1 200 OK`.
- Supabase Auth Site URL and redirect URLs are configured for `https://findit-campus-ng.vercel.app/`.
- Live Supabase Auth settings confirm: email provider enabled, signup enabled, and `mailer_autoconfirm: false`, so a new email must be confirmed before it is active.
- On web, `detectSessionInUrl: true` lets the confirmation link exchange its token and sign the user in; the redirect destination does not decide which email is confirmed. Supabase ties the confirmation token to the newly registered email.
- Anonymous access tests show:
  - public report fields are readable;
  - `contact_info` is denied to anonymous clients;
  - `admin_users` and `account_deletion_requests` are denied to anonymous clients;
  - storage bucket listing is empty and direct public photo URLs still work.
- No `service_role` key exists in the repository. Only the public anon key is used.
- `.env`, `.env.*`, and `.env*.local` are ignored by Git.
- Security decisions and raw test output are recorded in:
  - `docs/SECURITY_DECISIONS.md`
  - `docs/PRE_DEPLOY_SECURITY_CHECK.md`

## Pending owner/operator actions

### 1. Ownership in writing

Confirm in writing who owns:

- the GitHub repository;
- the Supabase project;
- the Vercel project and production domain;
- the support email inbox;
- the code, design, and deployed build.

If the buyer must own these, transfer them to buyer-controlled accounts and record the transfer.

### 2. Scope and price in writing

Put the agreed scope and price in writing before any further work. Include:

- what is included in the current version;
- what counts as extra work;
- who pays for third-party services;
- whether future changes need a new quote;
- acceptance criteria for any further delivery.

### 3. Deposit before more work

Collect the agreed deposit before starting further development, deployment changes, or custom work. Do not promise ongoing maintenance or 24/7 availability as part of the current scope.

### 4. Buyer-owned accounts

The buyer should own and control:

- the Supabase project used in production;
- the Vercel project and domain;
- the GitHub repository;
- the dedicated support email `findit.support00@gmail.com`.

If ownership cannot be transferred immediately, record who currently controls each account and how access will be handed over.

### 5. Support email monitoring

`findit.support00@gmail.com` is public in the Privacy Policy and Terms. It must be checked regularly. It will receive spam and messages from strangers.

### 6. Admin bootstrap

After the buyer confirms the staff account, add it to the admin table in the Supabase SQL Editor:

```sql
insert into public.admin_users (user_id)
select id from auth.users where email = 'STAFF_EMAIL_HERE'
on conflict (user_id) do nothing;
```

Admins can then review account deletion requests through `public.account_deletion_requests`.

### 7. Account deletion workflow

The app submits requests; it does not delete accounts automatically. An administrator must:

1. review `public.account_deletion_requests`;
2. remove or anonymise user data where required;
3. delete the auth user through the Supabase dashboard;
4. mark the request `completed` or `cancelled`.

### 8. Legal review

The Privacy Policy and Terms are in-app documents and are accurate to current enforcement, but they are not legal advice. Have them reviewed before relying on them commercially.

## Deferred technical items

These require a paid plan, external account, or buyer-provided information:

- Custom SMTP for Supabase Auth emails.
- CAPTCHA for signup/login; the secret must stay server-side.
- Supabase leaked-password protection and server-side password rules require Pro or above.
- Real WhatsApp group link; currently a placeholder in `src/constants/legal.ts`.
- Automated deletion execution; currently an admin-reviewed request workflow.
- Git-based auto-deploy; connect the Vercel project to GitHub when ready.
- Native deep-link return after email confirmation requires a standalone Expo build; currently the browser confirmation completes server-side, then the user reopens the app to log in.
- Native production builds and store submission are out of scope for this handoff.

## Support boundaries

- No uptime, 24/7 availability, or guaranteed response-time promise has been made.
- Emergency response, maintenance, and future feature work should be quoted separately.
- Supabase free-tier projects pause after inactivity; this can look like a network error in the app.
