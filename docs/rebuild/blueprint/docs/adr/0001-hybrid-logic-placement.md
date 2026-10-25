# 0001. Place logic by a mechanical rule: SQL for atomic invariants, TypeScript for the rest

- **Status:** accepted
- **Date:** 2026-10-24
- **Approver:** Alejandro Loaiza
- **Refs:** ARC-04, DB-17

## Context
Logic was split across Postgres RPCs, Edge Functions, a Next route and client hooks with no rule, so each change re-decided where code goes. `create_order` was re-created in five migrations.

## Decision
Apply the first matching rule: (1) atomic or concurrent invariants → SQL entry-point functions; (2) integrity → constraints + Zod; (3) authorization → TS DAL and RLS; (4) pure rules → `domain/`; (5) external systems → `integrations/`; (6) orchestration → `server/`. Triggers only for mechanical work.

## Alternatives considered
- **DB-centric** — hard to unit-test and review; business rules hidden in PL/pgSQL.
- **App-centric** — races on stock and idempotency unless we re-implement locking in TS.

## Consequences
Stock, order creation and transitions stay correct under concurrency. Most rules are plain, testable TypeScript. Some rules (e.g. constraints) are mirrored in Zod for friendly errors.
