# supabase

## Purpose

The database as code: declarative schema, generated migrations, pgTAP tests, demo seed and local stack config. The full model is in `docs/rebuild/02-er-design.md`.

## Owns / does not own

- **Owns:** `schemas/` (source of truth), `migrations/` (generated), `tests/` (pgTAP), `seed.sql`, `config.toml` (including exposed schemas and `pg_cron` jobs).
- **Does not own:** TS data access (`features/*/server/repository.ts`) or Edge Functions (we have none, ARC-05).

## Layout

```
schemas/
  00_extensions.sql   01_private/   02_public/ (shared domains, e.g. amount_crc)   05_events/   10_access/   20_media/   30_catalog/   35_retail/
  40_fulfillment/     50_inventory/   60_orders/   65_messaging/   70_notifications/   75_admin_chat/
  80_themes/          90_reporting/   99_cron.sql
  <schema>/ → 00_schema.sql, 10_enums.sql, 20_<table>.sql …, 50_functions.sql, 60_policies.sql, 70_grants.sql
```

The numeric prefixes give a dependency order (FK targets first).

## Workflow

1. Edit files in `schemas/`.
2. `npm run db:diff -- <name>` (`supabase db schema declarative sync`) → review the generated migration.
3. `npm run db:types`; commit schema + migration + types together.
4. Reference data (transitions, themes, permissions) → hand-written `migrations/<ts>_<name>_data.sql`, the **only** hand-written migrations.

## Conventions (see ER design §1)

- `snake_case`, plural tables, `<entity>_id` FKs (always indexed), `timestamptz`, `amount_crc` for money, enums for closed sets.
- PK `uuid default private.uuid_v7()`; settings singletons `id boolean primary key default true check (id)`.
- Named constraints: `<table>_<cols>_<key|check|fkey>`; indexes `<table>_<cols>_idx`.
- `created_at`, `updated_at` (trigger `private.set_updated_at`) on every table; `created_by`/`updated_by` on admin-edited ones.

## Security rules

- `enable row level security` on every table; revoke defaults; grant explicitly per role (`anon`, `authenticated`, `service_role`).
- Policies call `(select private.has_permission('<perm>'))`, wrapped in `select` so it's evaluated once.
- `security definer` functions: `set search_path = ''`, fully qualified names, `revoke execute ... from public`, then grant to the intended role only. Helpers in `private`; entry points in the owning schema.
- No business side effects in triggers (DB-17). Allowed: `updated_at`, price history.

## Testing

- `npm run test:db` (needs `supabase start`). One `tests/<schema>.test.sql` per schema: constraints, entry points, and **every policy × role**.
- `seed.sql` is deterministic demo data; tests create their own fixtures inside transactions.

## Implemented media and admission

- `20_media/` follows ER §4, including all five purposes. Immutable files intentionally have `created_at` only, unlike mutable tables. Only service_role inserts/deletes metadata; anonymous reads are catalog-only and proof reads require `orders.view`.
- Bucket reference configuration lives in `*_media_buckets.sql`: private proofs and public catalog, with limits mirroring `UPLOAD_POLICIES` in `features/media/domain/upload-policy`. Messaging bucket is deferred. Storage read policies live in the declarative tree; direct client writes are not granted.
- `private.rate_limits` and its service-only atomic function back upload admission. A service-only invoker in `public` bridges PostgREST; `private` remains unexposed. Callers supply HMAC keys, limits and windows. No raw IP storage and no scheduled cleanup in this item.
- `media.test.sql` tests schema shape, enum, grants, policies and rate-limit behavior. Integration tests also exercise concurrent admission.

## Implemented catalog

- `30_catalog/` follows ER §5. Anonymous and signed-in shoppers read active rows; `catalog.manage` reads everything and writes through RLS with `created_by` / `updated_by` = `auth.uid()`. No delete grants except on `product_categories`. Price history is select-only (managers); its rows have `changed_at` instead of `created_at` / `updated_at`, and category links carry `created_*` only.
- Invariants in SQL: partial unique indexes for one primary brand and one default variant per product; the deferrable constraint trigger `brands_guard_primary_brand` (`primary_brand_required`) keeps one while any brand is active; checks keep the primary brand and default variant from being archived; `private.require_file_purpose` (`file_purpose_mismatch`) keeps image columns to their media purpose.
- Invoker entry points granted to `authenticated`: `catalog.set_primary_brand`, `catalog.set_default_variant`, `catalog.set_product_categories`. They raise `brand_not_found`, `variant_not_found` and `category_not_found`.
- `seed.sql` adds the Snackyzz primary brand, Baking Stereo, two categories and sample products without `created_by`, so tests can remove the demo admins.

## Gotchas

- PostgREST reads `[api].schemas` when the stack starts. After adding a schema there, run `supabase stop && supabase start`; `db reset` keeps the old list and the API answers `Invalid schema`.
- The local stack's `project_id` is `snackyzz-rework`, so it keeps its own volumes apart from the legacy stack. Both use the default ports: stop one (`supabase stop --workdir <path>`) before starting the other.

- Postgres has no `add constraint if not exists`; let the diff tool generate constraint changes.
- Adding an enum value can't run inside a transaction that also uses it; put it in its own migration.
- Never put production data in `seed.sql`.
- PostgREST won't start while `config.toml` exposes a schema that doesn't exist yet. When adding a schema, run `supabase db start` (DB only) with a seed that doesn't use it, generate the migration, then `supabase start` and `db reset`.
- Demo admins in `seed.sql`: `owner@snackyzz.test` and `staff@snackyzz.test`, local password `snackyzz-demo`.
- Hosted projects need each new schema added to the Data API's exposed schemas too, not only `config.toml`.
- pgTAP runs inside a transaction that never commits, so deferred constraint triggers never fire there; the catalog guard is `initially immediate` for that reason, and entry points defer it themselves.
- Integration tests write catalog rows that can't be deleted. A test that empties `access.admins` sets `session_replication_role = replica` so audit FKs from other features don't block it.
