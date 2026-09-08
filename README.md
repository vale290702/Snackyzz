# Snackyzz

Responsive cookie storefront for Snackyzz. Customers can explore three products, manage a persistent cart, upload a required SINPE receipt, and submit an order. Administrators review private receipts, confirm orders, and monitor or retry confirmation email delivery.

## Stack

- Vite and modular browser JavaScript
- Supabase PostgreSQL, Auth, private Storage, and Edge Functions
- Resend for transactional confirmation email
- Node tests, Playwright browser flows, Deno function tests, and PostgreSQL-compatible migration tests

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
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLIC_PUBLISHABLE_KEY
```

Never expose the Supabase service-role key, database password, or Resend key through a `VITE_` variable. `.env.local` is ignored by Git.

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

- `src/pages/`: storefront, checkout, locations, information, and admin views
- `src/lib/`: Supabase client/API adapter, cart persistence, routing, and safe HTML helpers
- `assets/`: authored product imagery, self-hosted fonts, source prompts, and licenses
- `supabase/migrations/`: database schema, row-level security, and transactional RPCs
- `supabase/functions/`: public order creation and authenticated order management
- `tests/`: unit and responsive browser tests

## Production checklist

Deploy the frontend over HTTPS, apply the migration and Edge Functions, configure a verified email sender and exact allowed origins, enter the real SINPE recipient and sales locations, create the administrator membership, and run a controlled end-to-end order using an address you own. Add monitoring, retention/backup decisions, and public checkout abuse controls before accepting real traffic.
