# 0003. One Postgres schema per feature, managed declaratively

- **Status:** accepted
- **Date:** 2026-10-24
- **Approver:** Alejandro Loaiza
- **Refs:** DB-01, DB-18

## Context

Everything lived in `public`, and imperative migrations repeatedly dropped and re-created functions, making the current schema hard to read.

## Decision

Each feature that owns data has a schema of the same name (`catalog`, `orders`, …); internals live in an unexposed `private` schema. Source of truth is `supabase/schemas/`; migrations are generated with `supabase db diff`. Reference data goes in hand-written `*_data.sql` migrations.

## Alternatives considered

- **Single `public` schema** — no ownership boundary; accidental exposure through PostgREST.
- **`api` schema of views over private tables** — more SQL indirection than a small shop needs.

## Consequences

Ownership mirrors `src/features`. New schemas must be added to the exposed list and granted explicitly. Cross-schema FKs are allowed; cross-schema writes go through entry points.
