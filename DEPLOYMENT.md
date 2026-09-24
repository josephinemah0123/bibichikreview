# Multi-outlet review system — Node.js deployment

## What is ready

One Next.js App Router app, shared review components, one central configuration (`config/outlets.ts`), one Supabase PostgreSQL `reviews` table and one protected dashboard. No Vercel APIs, Wrangler, serverless-only services, JSON-file database or Docker requirement.

| Outlet | Canonical public route | Existing alias |
| --- | --- | --- |
| BiBiChik SS2 | `/review/bibichik-ss2` | `/review/ss2` |
| BiBiChik Sunway 163 Mall | `/review/bibichik-sunway-163` | `/review/sunway-163` |
| Aburii Yakiniku | `/review/aburii-yakiniku` | `/review/aburii` |

Aliases render the same outlet directly; they never redirect to another outlet. `/` and `/review` still redirect to `/review/ss2`. Unknown or inactive outlets return 404. Add a configuration entry and deploy to add another outlet, without creating a page or table.

## Connect Supabase before collecting dashboard data

1. Create your Supabase project. Run `supabase/migrations/001_review_system.sql` in its SQL editor. It creates one reviews table, indexes, private server-only RPCs and a small request-limit table.
2. Set server environment variables from `.env.example`: `SUPABASE_URL`, `SUPABASE_ANON_KEY` (legacy anon JWT), `SUPABASE_SERVICE_ROLE_KEY` (legacy service-role JWT), `ADMIN_EMAILS`, `RATE_LIMIT_SECRET`, and `SITE_URL` (your exact public HTTPS origin, without a path or trailing slash). The keys are never sent to the browser. Do not use a service-role key in a NEXT_PUBLIC variable.
3. Create and confirm the management user in Supabase Auth. Set its email in `ADMIN_EMAILS`; multiple managers use comma-separated addresses. Merely having a Supabase account does not grant dashboard access. Disable public signups if not needed. Password resets and invitations are managed in Supabase Auth.
4. Generate the rate-limit secret using `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`. Keep it in hosting secrets. Never commit `.env.local` or share secret keys in chat.
5. Set `TRUSTED_CLIENT_IP_HEADER` only when your host guarantees that this header is overwritten with the real client address. Without it, the application deliberately shares limits across clients: 120 review submissions per hour and 10 login attempts per 15 minutes. With a trusted header, limits apply per hashed address. This conservative default avoids trusting spoofable forwarded headers. Configure the host's reverse-proxy rate limits too.
6. Deploy and visit `/admin/login`. The app validates the session with Supabase Auth on each admin request, checks the confirmed email against the allowlist, and uses an HttpOnly, Secure (production), SameSite=Strict cookie. Sessions expire after at most one hour; sign in again. There is no frontend password, public dashboard endpoint or auth bypass.

Until Supabase is configured, the current direct-to-FormSubmit flow works but no database history is recorded. The admin login explicitly reports missing configuration and cannot grant access. Historical FormSubmit emails are not automatically imported.

## Emails and Google links

The existing shared email recipient is **feedback@bibichik.com**. It is preserved from the project as inspected at the start of this change. `FEEDBACK_EMAIL` configures the shared inbox, and the three optional `FEEDBACK_EMAIL_*` variables override it per outlet. All three use that shared inbox unless overridden. A recipient is public in the browser because the approved flow submits directly to FormSubmit.

For 1–3 stars, valid feedback is first saved when Supabase is configured, then the frontend submits directly to FormSubmit using its AJAX endpoint. A failed database save stops that attempt and uses the existing error UI. If email fails after storage, the review remains visible internally. Retrying identical feedback uses the same submission UUID while the form remains mounted, preventing duplicate database records. Email delivery and the database are separate; there is no claim of transactional email delivery. FormSubmit can require activation for a recipient/site. No email test was sent during this extension.

The original six email fields remain, and outlet ID, brand, outlet name, overall rating, feedback and submission time are included. SS2 retains its exact email subject. Other subjects use their own outlet name. Database `created_at` comes from PostgreSQL, not a browser timestamp; brand and outlet name are resolved on the server, never trusted from the client.

For 4–5 stars, the existing automatic redirect remains. When database storage is enabled, the first positive selection per page visit is sent using fetch keepalive before navigation. This records a **website rating**, not a Google review. As with any navigation-time request, a lost network can prevent recording; a Google review is never auto-posted and its publication cannot be inferred from a click. With no outlet Google URL configured, the existing thank-you card remains and no redirect occurs.

- `GOOGLE_REVIEW_URL_SS2`: defaults to the exact latest Google URL supplied by the owner. `NEXT_PUBLIC_GOOGLE_REVIEW_URL` is retained as an SS2-only legacy override. That supplied link opens Google search/reviews, not a guaranteed compose window.
- `GOOGLE_REVIEW_URL_SUNWAY_163`: intentionally blank; supply the verified Sunway link.
- `GOOGLE_REVIEW_URL_ABURII`: intentionally blank; supply the verified Aburii link.
- `WEBSITE_URL_BIBICHIK` / `WEBSITE_URL_ABURII`: optional website-return links. The legacy website variable applies only to SS2.
- Aburii logo/tagline are intentionally empty in configuration; a restrained text wordmark is used until official assets are supplied. No invented logo or slogan.

Lower-rating customers retain the secondary Google link whenever their outlet has a configured link. No outlet inherits SS2's Google link.

## GoDaddy or another persistent Node host

Choose GoDaddy's **Node.js Hosting** product with a supported Node.js 22.13+ or Node.js 24 runtime (this implementation was checked on Node 24). This is a running Node application, not a static upload to ordinary PHP-only hosting. Confirm the runtime options in the actual hosting plan before switching traffic.

Run from the folder containing `package.json`:

```sh
npm install
npm run build
npm start
```

`next start` uses the host's `PORT` variable automatically; otherwise it listens on 3000. Configure environment variables on the host, HTTPS, and the host's process supervision/restart mechanism. Keep `.next`, `public`, package files and production dependencies available. Keep development dependencies during the build. No Vercel-specific command, output directory or middleware is required. Existing Vercel deployment remains supported too.

The package root is `outputs/bibichik` in the surrounding workspace, or the root of the delivered ZIP. Do not deploy `work/`, test adapters, caches, `.git`, or `.env.local`.

## Dashboard

`/admin` is checked server-side before querying private data. Brand, outlet, rating, category and date filters apply to every metric, distribution, trend, outlet summary and review list. Dates are inclusive Malaysian calendar days converted into half-open UTC bounds. Contradictory brand/outlet combinations correctly return no rows. Custom date ranges reject impossible or reversed dates. Review lists fetch 25 rows per page. Comments render as escaped text, preserving line breaks.

There were no food/service/environment subratings in the original model, so no fictional subrating averages are shown. The original categories, comment, optional name and combined phone/email field are preserved. Trends show daily buckets up to 90 days and monthly buckets for longer ranges; buckets with no submissions are omitted. Average rating is `—` for no matching data.

## Operations

Enable Supabase backups appropriate to the business and restrict project administrator access. Retain or delete customer contact details according to the business's retention policy. Review text is not included in application error logs. Rate-limit hashes are HMAC values rather than raw client IPs. Periodically clean expired request limits with:

```sql
delete from public.request_limits where resets_at < now() - interval '1 day';
```

No destructive migration of existing customer records is performed. The current project previously had no database. If importing historic email feedback later, map SS2 records to `bibichik-ss2` and retain the original timestamps; do not assume this migration imports emails.

## Verification

```sh
node scripts/test-feedback.mjs
node --test tests/database.test.mjs
npx eslint app components/review components/admin config lib tests scripts
npm run build
npm start
```

The first command runs the original FormSubmit/validation tests and new route-attribution/date tests. The database test runs the actual migration and queries in an isolated in-memory PostgreSQL engine (PGlite, development dependency only), including permission-denial checks. It does not replace the production Supabase connection.

The `lint` npm script remains `next lint` to respect the owner's prior explicit requirement. Next.js 16 removed that command; use the direct ESLint command above. Build and runtime do not depend on it.

Real Supabase credentials, hosted Auth login, FormSubmit activation/delivery and a GoDaddy deployment still need verification after the owner connects those services. Local QA uses an isolated Auth response adapter and an in-memory database, not real customer data or a production authentication bypass.
