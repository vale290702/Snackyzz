# src/integrations

## Purpose

Thin, typed wrappers around external systems: Supabase clients, Resend (email) and the Telegram Bot API. Translate vendor APIs into small typed functions; contain no business decisions.

## Owns / does not own

- **Owns:** client construction, auth headers, HTTP calls, vendor error → typed error mapping, generated `supabase/database.types.ts`.
- **Does not own:** when or what to send, who may call it, retries policy (that's `notifications/domain/retry.ts`).

## Public API

- `supabase/server-client.ts`: `createServerClient()` (user session from cookies, RLS applies)
- `supabase/anon-client.ts`: `createAnonClient()` (no cookies, for `'use cache'` public reads)
- `supabase/service-client.ts`: `createServiceClient()` (service role, **server-only**)
- `supabase/browser-client.ts`: `createBrowserClient()`, auth and signed uploads only
- `supabase/database-client.types.ts`: `DatabaseClient` (`SupabaseClient<Database>`), `Database`. Query other schemas with `client.schema("access")`.
- `supabase/fetch-with-timeout.helper.ts`: `fetchWithTimeout`, the 10 s `fetch` every Supabase client uses
- `resend/send-email.ts`: `sendEmail({ to, subject, html, text, idempotencyKey })` → `Result<{ id }, ProviderError>`
- `telegram/bot-api.ts`: `sendMessage`, `editMessage`, `answerCallback`, `getFile`, `verifySecret`

## Invariants

- Every file except `browser-client.ts` starts with `import "server-only"`.
- `service-client.ts` may only be imported from `features/*/server/**` (ESLint rule). Callers authorize **before** using it.
- Functions return `Result` with a `retryable | permanent` error kind; they never throw for vendor 4xx/5xx.
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
