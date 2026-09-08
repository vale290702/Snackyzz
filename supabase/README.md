# Snackyzz · Supabase

This replaces the earlier local Flask prototype. The Supabase project must have
the migration and Edge Functions deployed before live ordering works. Public
project keys let the storefront connect; they cannot apply migrations, publish
functions, create administrators or configure email secrets.

## Architecture

- PostgreSQL stores the three demo products, public payment settings, orders,
  immutable item prices and a durable email outbox.
- Supabase Auth handles administrator email/password sign-in. Membership in
  `public.admin_users` grants access; editable user metadata never grants a role.
- The private `receipts` Storage bucket holds validated, re-encoded JPEGs. Only
  administrator accounts may read it. Customers upload through `create-order`.
- Edge Functions use the server-only service-role key. `manage-orders` first
  validates the user's JWT with `auth.getUser(token)` and checks membership.
- Resend sends confirmation emails after the administrator confirms the payment.

## Deploy to a project

Use a Supabase account with access to the intended project. Install the
[Supabase CLI](https://supabase.com/docs/guides/local-development/cli/getting-started)
or use `npx supabase` with a supported recent Node.js version.

```sh
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
supabase functions deploy create-order
supabase functions deploy manage-orders
```

The migration is `migrations/202609080001_snackyzz.sql`. `db push` applies the new
schema; review the target project before running it. For a new project, the SQL
can alternatively be run in the Dashboard SQL editor. Do not run `db reset` on a
hosted project. If applied manually, repair the CLI migration history before
switching to `db push` so it does not try to create the tables twice.

`config.toml` sets `verify_jwt=false` for both functions. `create-order` is a public
checkout endpoint. `manage-orders` authenticates and authorizes inside the handler;
this supports asymmetric Supabase Auth signing keys without trusting token text.

Set these Edge Function secrets in the Dashboard (or with `supabase secrets set`):

| Secret            | Value                                                                                                              |
| ----------------- | ------------------------------------------------------------------------------------------------------------------ |
| `ALLOWED_ORIGINS` | Comma-separated exact frontend origins, e.g. `http://localhost:5174,https://your-store.example`; no trailing slash |
| `RESEND_API_KEY`  | Resend API key allowed to send email                                                                               |
| `FROM_EMAIL`      | Sender on a domain verified with Resend, e.g. `Snackyzz <orders@your-domain.example>`                              |

Hosted Supabase provides `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` to the
functions. Never put a service-role key, Resend key or database password in a
`VITE_` variable or a browser bundle. Secrets must not be committed.

Copy the root `.env.example` to `.env.local` and set the **public** project values:

```dotenv
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLIC_PUBLISHABLE_OR_ANON_KEY
```

Restart Vite after changing those values. `ALLOWED_ORIGINS` must include the exact
origin Vite prints (localhost and 127.0.0.1 are different origins).

## Create the administrator

1. Create an email/password user in Dashboard → Authentication → Users. Use the
   intended administrator's email and a strong password; confirm the email via
   the normal invitation flow or the dashboard's administrator creation controls.
2. Copy that user's UUID. In the SQL editor run:

```sql
insert into public.admin_users(user_id)
values ('REPLACE_WITH_AUTH_USER_UUID');
```

3. Sign in on the store's administration screen using that email/password.
4. Disable public new-user signup in Auth settings if this project is dedicated
   to store administration. Configure Auth rate limits and production site URLs.

Removing the membership row immediately removes database and Edge Function admin
access. Existing signed receipt links remain valid until their ten-minute expiry.
Do not share them. There is no anonymous password reset or administrator signup
flow in the storefront; manage accounts through Supabase Auth.

## Real catalog and SINPE data

The seed contains exactly three explicitly marked demo products with CRC integer
prices, blank payment details and no fabricated locations. Replace names, prices,
descriptions and `/assets/…` images with confirmed business data. Set
`store_settings.demo_catalog=false` only after replacing the sample catalog.

```sql
update public.store_settings
set sinpe_number='CONFIRMED_NUMBER', sinpe_recipient='CONFIRMED_RECIPIENT'
where id=1;
```

The app permits clearly labeled demo orders with payment configuration blank.
Do not treat them as proof of a real payment. `sales_points` stays empty until
real names, addresses, hours and map URLs are supplied.

## Browser API contract

Catalog reads use the public Supabase client:

```js
supabase.from("products").select("*").eq("active", true).order("position");
supabase.from("sales_points").select("*").order("position");
supabase.from("store_settings").select("*").eq("id", 1).single();
```

`products` contains `id,name,price,description,tag,image,accent,position,active`.
`store_settings` contains `demo_catalog,sinpe_number,sinpe_recipient` and singleton
`id=1`. `sales_points` contains `id,name,city,address,hours,map_url,position`.

`functions.invoke('create-order', {body: formData, headers: {'Idempotency-Key': key}})`:
multipart `name,email,phone,items,receipt`. `items` is a JSON array of
`{productId,quantity}`. Required `receipt` is a JPG/PNG, maximum 5 MB and 12 MP.
The function checks image dimensions before decode and re-encodes the pixels as
JPEG without source metadata. The database computes authoritative totals using
active products and quantities from 1 to 99; client-supplied prices are ignored.

Returns `201 {order:{id,status,total,createdAt}}` after both private upload and
database commit. The same key and same normalized fields/original receipt bytes
returns `200` with the same order. A changed payload on the same key returns `409`.
Keep the key on network failures. Keys must have 8–128 alphanumeric, `_` or `-`
characters. Errors return JSON `{error: "Spanish explanation"}`.

Administrator calls:

```js
supabase.auth.signInWithPassword({ email, password });
supabase.rpc("is_admin");
supabase.functions.invoke("manage-orders", { method: "GET" });
supabase.functions.invoke("manage-orders", {
  body: { action: "confirm", orderId },
});
// Explicit retry: action: 'retry-email'
supabase.auth.signOut();
```

The SDK sends the user's access JWT. GET returns `{orders}`; mutations return
`{order}`. Each order contains `id,name,email,phone,items,total,status,createdAt,
confirmedAt,emailStatus,receiptUrl`. Item snapshots include
`productId,name,price,quantity`. `receiptUrl` is a private signed link valid for
ten minutes; refresh the list to renew it. Mutations require Bearer authentication,
so there is no ambient cookie or cookie-based CSRF token.

## Email guarantees and recovery

`status` is `pending` or `confirmed`; confirmation is a durable administrator
decision. `emailStatus` is `not_sent,pending,sending,sent,failed,unknown`.
Missing Resend settings produce `failed`, preserving the confirmation and allowing
explicit retry after configuration. No successful delivery is simulated.

The transaction locks the order/outbox to claim one send. Repeated confirm clicks
do not resend. Explicit retry can claim a failed attempt or a send stalled for
more than two minutes. Resend receives the stable key `snackyzz-confirm-ORDER_ID`
and the exact persisted payload, protecting concurrent/ambiguous retries within
its [24-hour idempotency window](https://resend.com/docs/dashboard/emails/idempotency-keys).
The application stops automatic API retries at 23 hours after first provider
attempt and exposes `unknown` to allow operator reconciliation.

For `unknown`, inspect the order and Resend logs first. If the message was accepted,
record the provider ID and `sent` in `email_outbox` through trusted administration.
If verified never accepted, an operator can explicitly reset the outbox after
deciding that a new provider attempt is safe. Never blindly reset uncertain sends.
`sent` means Resend accepted the message; it does not assert inbox placement.

Storage upload and PostgreSQL commit cannot be a single cross-service transaction.
Definite database rejections and reused submissions clean up the extra uploaded
object. Ambiguous database network failures preserve the receipt because the
order may have committed. Periodically reconcile old unreferenced objects in
`receipts` against `orders.receipt_path` after a generous grace period; delete only
confirmed orphans via the Storage API, never by deleting Storage metadata rows.

## Tests and limits of local verification

With Deno installed, from `supabase/functions`:

```sh
deno task check
deno task test
```

Or use `npx -y deno` in place of `deno`. Deno caches pinned dependencies; ImageScript
uses WebAssembly fetched from `deno.land` (no native image add-on). Tests allow that
host only and inject the email transport, never contacting Resend or real users.
The PostgreSQL test uses PGlite's real PostgreSQL engine with minimal Auth/Storage
fixtures. It validates migration execution, role grants/RLS, cart constraints,
idempotency and outbox claims. PGlite is single-connection, so the test does not
simulate separate PostgreSQL sessions racing for the same lock.

These are not evidence of a live Supabase deployment. After deployment verify a
demo order upload, admin-only receipt access, administrator confirmation and a
controlled Resend delivery with an address you own. Production also needs hosting
HTTPS, the intended Auth settings, monitoring, backup/retention decisions and
appropriate public checkout abuse controls (Supabase gateway limits/CAPTCHA as
traffic requires). Never expose `db reset` or privileged RPCs to clients.

Implementation references: [Supabase Edge auth](https://supabase.com/docs/guides/functions/auth),
[private Storage policies](https://supabase.com/docs/guides/storage/security/access-control),
[Resend from Edge Functions](https://supabase.com/docs/guides/functions/examples/send-emails),
[PGlite](https://pglite.dev/docs/).
