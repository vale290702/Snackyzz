# src/integrations

## Purpose

Thin, typed wrappers around external systems: Supabase clients, Resend (email) and the Telegram Bot API. Translate vendor APIs into small typed functions; contain no business decisions.

## Owns / does not own

- **Owns:** client construction, auth headers, HTTP calls, vendor error → typed error mapping, generated `supabase/database.types.ts`.
- **Does not own:** when or what to send, who may call it, retries policy (that's `notifications/domain/retry/retry.helper.ts`).

## Public API

- `supabase/server-client`: `createServerClient()` (user session from cookies, RLS applies)
- `supabase/anon-client`: `createAnonClient()` (no cookies, for `'use cache'` public reads)
- `supabase/service-client`: `createServiceClient()` (service role, **server-only**)
- `supabase/browser-client`: `createBrowserClient()`, auth and signed uploads only
- `supabase/database-client.types.ts`: `DatabaseClient` (`SupabaseClient<Database>`), `Database`. Query other schemas with `client.schema("access")`.
- `supabase/transport`: `SupabaseFetch.withTimeout`, the 10 s fetch adapter every client uses; implementation, constants and tests are colocated.
- Planned `resend/send-email` (directory entry point): `sendEmail({ to, subject, html, text, idempotencyKey })` → `Result<{ id }, ProviderError>`
- Planned `telegram/bot-api` (directory entry point): `sendMessage`, `editMessage`, `answerCallback`, `getFile`, `verifySecret`

Follow [the canonical conventions](../../docs/code-conventions.md); provider operations use `.adapter.ts`, client constructors use `.factory.ts`.

## Invariants

- Server/anon/service client factories and their entry points import `server-only`. Browser factories and shared transport remain browser-safe; type-only and generated files need no runtime guard.
- Each client purpose has its own directory, role-suffixed factory and `index.ts`. Never combine browser and service/server exports in a barrel. Keep the generated `database.types.ts` at its generator-owned path.
- `supabase/service-client` may only be imported from `features/*/server/**` (ESLint rule). Callers authorize **before** using it.
- Provider operation adapters return `Result` with a `retryable | permanent` error kind; they never throw for vendor 4xx/5xx. Client constructors and low-level fetch transport retain their native contracts.
- Request timeouts are always set (10 s default).
- `database.types.ts` is generated (`npm run db:types`, schemas `public,access`; add each new feature schema to the script); never edit it. Its `Constants` give Zod the enum values.

## Dependencies

`shared/lib`, `shared/config`.

## Testing

Unit tests with a stubbed `fetch` for each wrapper: success, 4xx → permanent, 5xx/timeout → retryable.

## Gotchas

- Telegram ids exceed 2^31; keep them as strings end to end.
- Resend supports an idempotency key header; pass the message `dedupe_key`.
- `createServerClient()` is async (Next 16 `cookies()`); its `setAll` is a no-op in Server Components, which can't write cookies.
