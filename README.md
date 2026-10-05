# Snackyzz

Responsive cookie storefront for Snackyzz. Customers can explore the Snackyzz and Baking Stereo catalogs, manage a persistent cart, upload a required SINPE receipt, and submit an order. Administrators review private receipts, confirm orders, and monitor or retry confirmation email delivery.

## Stack

- Next.js App Router, React, and strict TypeScript (existing hash routes preserved)
- Supabase PostgreSQL, Auth, private Storage, and Edge Functions
- Resend for transactional confirmation email
- Vitest component/unit tests, Playwright browser flows, Deno function tests, and PostgreSQL-compatible migration tests

## Run locally

Use Node 22.12 or newer:

```sh
nvm use
npm install
cp .env.example .env.local
npm run dev
```

Open `http://127.0.0.1:5174`. Add these public values to `.env.local`:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLIC_PUBLISHABLE_KEY
```

Never expose the Supabase service-role key, database password, or Resend key through a `NEXT_PUBLIC_` variable. `.env.local` is ignored by Git.

## Supabase setup

The connected project needs the schema and functions before live orders can work:

```sh
supabase login
supabase link --project-ref skncqvywmionhtfipixt
supabase db push
supabase functions deploy create-order
supabase functions deploy manage-orders
```

Then configure `ALLOWED_ORIGINS`, `RESEND_API_KEY`, and `FROM_EMAIL` as Edge Function secrets. Create the administrator in Supabase Auth and add its UUID to `public.admin_users`. Full setup, recovery rules, security details, and SQL examples are in [supabase/README.md](supabase/README.md).

The migration starts with three clearly labeled sample products, blank SINPE details, and no invented sales locations. Replace those values with confirmed business information before setting `demo_catalog=false`.

## Test and build

```sh
npm run typecheck
npm run lint
npm test
npm run build
npm run test:e2e
```

The browser tests intercept Supabase and use synthetic customer data and a generated receipt fixture; they do not create orders or send email. Supabase function/database checks run from `supabase/functions`:

```sh
deno task check
deno task test
```

## Project map

- `src/app/`: Next.js document and application entry
- `src/components/`: React application state, navigation, cart and product dialog
- `src/features/`: storefront, checkout and administration components
- `src/lib/`: Supabase client/API adapter, cart persistence, routing, and safe HTML helpers
- `public/assets/`: runtime imagery, self-hosted fonts and licenses (same URLs)
- `assets/`: original asset provenance, source prompts and licenses
- `supabase/migrations/`: database schema, row-level security, and transactional RPCs
- `supabase/functions/`: public order creation and authenticated order management
- `tests/`: unit and responsive browser tests

## Production checklist

Deploy the frontend over HTTPS, apply the migration and Edge Functions, configure a verified email sender and exact allowed origins, enter the real SINPE recipient and sales locations, create the administrator membership, and run a controlled end-to-end order using an address you own. Add monitoring, retention/backup decisions, and public checkout abuse controls before accepting real traffic.

## Frontend migration and deployment

The migration lives on `migration/nextjs-typescript`. Hash URLs, the `snackyzz-cart`
localStorage format, Supabase browser auth, and all Edge Function contracts are
preserved. No backend deployment or database migration is needed for this frontend
replacement. During deployment, `next.config.ts` also accepts the existing public
`VITE_SUPABASE_*` names. `NEXT_PUBLIC_SUPABASE_ANON_KEY` remains supported as a fallback for
projects using a legacy public anon key.

For a production-mode local check, run `npm run build` then `npm start`.
The browser suite defaults to port 5175; to test a production server use:

```sh
PLAYWRIGHT_BASE_URL=http://127.0.0.1:5176 \
PLAYWRIGHT_SERVER_COMMAND="npm run start -- --port 5176" npm run test:e2e
```

Vercel should use the Next.js preset, Node 22 or newer, and the two public
`NEXT_PUBLIC_` environment values above. Preview mutation tests require a staging
Supabase project and that preview's exact origin in the Edge Functions'
`ALLOWED_ORIGINS`. Production cutover requires review of the preview first.

Rollback: restore the previous frontend deployment built from `6396184` with its
original Vite environment names. Keep the same public origin to retain browser
cart and login storage. Do not roll back or reseed customer database data.
