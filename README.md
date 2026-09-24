# Restaurant Review System

Existing BiBiChik review project extended to three outlets using one Next.js App Router codebase. The approved SS2 stylesheet, assets and rating interface are preserved. Sunway reuses the BiBiChik theme; Aburii uses a scoped charcoal-and-cream theme.

## Run

Use Node.js 22.13+ or 24.

```sh
npm install
npm run build
npm start
```

For development: `npm run dev`.

## Routes

- `/review/bibichik-ss2` (existing `/review/ss2` still works)
- `/review/bibichik-sunway-163` (alias `/review/sunway-163`)
- `/review/aburii-yakiniku` (alias `/review/aburii`)
- `/admin/login` and protected `/admin`

Root and `/review` still redirect to `/review/ss2`.

## Configuration

Outlets live in `config/outlets.ts`. Add an entry to add a route without copying pages. The new outlets' Google links and Aburii official logo are intentionally unset until supplied by the owner.

Use `.env.example` for server settings. Supabase PostgreSQL and Auth power private storage and the shared management dashboard; run `supabase/migrations/001_review_system.sql` before enabling the connection. FormSubmit continues to receive feedback directly from the browser. Existing feedback recipient: `feedback@bibichik.com`.

Without Supabase credentials, public email feedback remains available but database history and admin sign-in are not enabled. No sample data is shipped in the production application.

See [DEPLOYMENT.md](DEPLOYMENT.md) for Supabase setup, admin access, email behavior, exact environment variables, GoDaddy Node.js hosting, security and verification steps.

## Tests

```sh
node scripts/test-feedback.mjs
node --test tests/database.test.mjs
npx eslint app components/review components/admin config lib tests scripts
npm run build
```

The `lint` npm script remains `next lint` at the owner's prior request; Next.js 16 no longer supports it. Use the direct ESLint command above.
