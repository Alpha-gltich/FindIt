# FindIt pre-deploy security check

Date: 26 November 2026

All requests below used only the public anon key from `src/services/supabase.ts`. No `service_role` key was used or added.

The PostgREST root endpoint returned `HTTP 401` with an empty body, so it cannot be used to enumerate tables. The table list below comes from the app's data access and the SQL migrations: `reports`, `admin_users`, `account_deletion_requests`.

## Anonymous table access — raw responses

### `GET /rest/v1/reports?select=*&limit=1`

```text
HTTP 401
{"code":"42501","details":null,"hint":"Grant the required privileges to the current role with: GRANT SELECT ON public.reports TO anon;","message":"permission denied for table reports"}
```

### `GET /rest/v1/admin_users?select=*&limit=1`

```text
HTTP 401
{"code":"42501","details":null,"hint":"Grant the required privileges to the current role with: GRANT SELECT ON public.admin_users TO anon;","message":"permission denied for table admin_users"}
```

### `GET /rest/v1/account_deletion_requests?select=*&limit=1`

```text
HTTP 404
{"code":"PGRST205","details":null,"hint":null,"message":"Could not find the table 'public.account_deletion_requests' in the schema cache"}
```

This means the deletion-request migration has not been applied, or PostgREST has not reloaded its schema cache. The migration now ends with `notify pgrst, 'reload schema';`.

### `GET /rest/v1/reports?select=contact_info&limit=1`

```text
HTTP 401
{"code":"42501","details":null,"hint":"Grant the required privileges to the current role with: GRANT SELECT ON public.reports TO anon;","message":"permission denied for table reports"}
```

### `GET /rest/v1/reports?select=id,type,item_name,photo_url&limit=1`

```text
HTTP 200 200
[{"id":"9bd129a4-7099-45e1-a2c5-3f2514c1fb53","type":"lost","item_name":"Brown locker","photo_url":"https://bkgtlddjmfkjfmjeogzu.supabase.co/storage/v1/object/public/report-photos/108913e2-650b-4981-91d4-ef17e833ec76/1787607277208.jpeg"}]
```

## Storage — raw responses

### `GET /storage/v1/bucket`

```text
HTTP 200 200
[]
```

### `POST /storage/v1/object/list/report-photos`

Request body:

```json
{"prefix":"","limit":100,"offset":0,"sortBy":{"column":"name","order":"asc"}}
```

Response:

```text
HTTP 200 200
[]
```

### `GET /storage/v1/object/public/report-photos/<first report photo>`

```text
HTTP 200 200
Content-Type: image/jpeg
Content-Length: 22466
```

## RPC — raw response

### `POST /rest/v1/rpc/is_admin`

Request body: `{}`

```text
HTTP 401
```

## Auth settings — raw response

### `GET /auth/v1/settings`

```text
HTTP 200
{"external":{"anonymous_users":false,"apple":false,"azure":false,"bitbucket":false,"discord":false,"facebook":false,"snapchat":false,"figma":false,"fly":false,"github":false,"gitlab":false,"google":false,"keycloak":false,"kakao":false,"linkedin":false,"linkedin_oidc":false,"notion":false,"spotify":false,"slack":false,"slack_oidc":false,"workos":false,"twitch":false,"twitter":false,"email":true,"phone":false,"zoom":false},"disable_signup":false,"mailer_autoconfirm":false,"phone_autoconfirm":false,"sms_provider":"twilio","saml_enabled":false,"saml_private_key_next_configured":true,"passkeys_enabled":false}
```

`mailer_autoconfirm: false` means email confirmation is required. `disable_signup: false` and `email: true` mean email signup is enabled.

A real-email test was completed on 27 November 2026: registration showed the "Check your email" message, the confirmation link landed the user logged in, and a subsequent logout/login succeeded.

## Deployed headers — raw response

### `GET https://findit-campus-ng.vercel.app/?cb=20261127`

```text
HTTP/1.1 200 OK
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://bkgtlddjmfkjfmjeogzu.supabase.co; font-src 'self' data:; connect-src 'self' https://bkgtlddjmfkjfmjeogzu.supabase.co wss://bkgtlddjmfkjfmjeogzu.supabase.co; frame-ancestors 'none'; base-uri 'self'; form-action 'self'
Permissions-Policy: camera=(), microphone=(), geolocation=()
Referrer-Policy: strict-origin-when-cross-origin
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
```

## Credential and secret search

Search terms: `key`, `secret`, `token`, `password`, `service_role`

Excluded: `.git`, `node_modules`, `dist`, `.expo`, `web-build`

Findings:

- No `service_role` key exists anywhere in the project.
- The only Supabase credential is the public anon key in `src/services/supabase.ts`.
- `package-lock.json` matches are dependency names such as `js-tokens`, `path-key`, and `metro-cache-key`; they are not credentials.
- Other matches are ordinary React `key` props, UI password fields, password-recovery state, and documentation text.
- A stale README statement claiming that anonymous API calls could read `contact_info` was found and corrected.
- `.gitignore` contains `.env`, `.env.*`, and `.env*.local`.

`git check-ignore` confirmation is captured in the deployment session output.

## Verification status

- Public report reads work.
- Anonymous `contact_info`, admin table, RPC, and bucket listing access are denied or empty.
- Public photo URLs still work.
- `account_deletion_requests` still requires applying the migration and reloading the schema cache before the Delete Account screen can work.
