# supabase

## Purpose
The database as code: declarative schema, generated migrations, pgTAP tests, demo seed and local stack config. The full model is in `docs/rebuild/02-er-design.md`.

## Owns / does not own
- **Owns:** `schemas/` (source of truth), `migrations/` (generated), `tests/` (pgTAP), `seed.sql`, `config.toml` (including exposed schemas and `pg_cron` jobs).
- **Does not own:** TS data access (`features/*/server/repository.ts`) or Edge Functions (we have none, ARC-05).

## Layout
```
schemas/
  00_extensions.sql   01_private/   05_events/   10_access/   20_media/   30_catalog/   35_retail/
  40_fulfillment/     50_inventory/   60_orders/   65_messaging/   70_notifications/   75_admin_chat/
  80_themes/          90_reporting/   99_cron.sql
  <schema>/ → 00_schema.sql, 10_enums.sql, 20_<table>.sql …, 50_functions.sql, 60_policies.sql, 70_grants.sql
```
The numeric prefixes give a dependency order (FK targets first).

## Workflow
1. Edit files in `schemas/`.
2. `npm run db:diff -- <name>` → review the generated migration.
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

## Gotchas
- Postgres has no `add constraint if not exists`; let the diff tool generate constraint changes.
- Adding an enum value can't run inside a transaction that also uses it; put it in its own migration.
- Never put production data in `seed.sql`.
