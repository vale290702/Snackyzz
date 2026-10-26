# Inventory implementation plan

**Goal:** Build the inventory work item specified by the user, based on ER §8 and §12, without UI or order reservations.

**Architecture:** SQL owns atomic stock changes and pool selection. Domain schemas parse inputs; permissioned capabilities call repositories through Server Actions. Public availability uses an anonymous client and tagged caching.

**Constraints:** No API table writes, generated migrations and types only, no dependencies, functions ≤50 lines, field error codes and Spanish copy. Preserve the concurrent events work and defer catalog/fulfillment extraction until PR #31 merges.

- [x] Fetch origin/rework and create isolated feat/inventory worktree.
- [x] Read repository guides and references; write and run failing stock rule tests.
- [x] Implement and verify pure stock rules and input schemas.
- [x] Add declarative 50_inventory schema: levels, append-only movements, private single writer and resolver, authorized admin entry points, anon availability.
- [x] Generate migration; apply locally; restart API for exposed schema; generate types.
- [x] Build inventory repositories, capabilities, mutation runner, actions, cached availability, authorized admin reads and error copy.
- [x] Add pgTAP role/constraint/entry-point tests and integration coverage including concurrency and pg_safeupdate paths.
- [x] Update guides and ER with orders split; seed through the private writer without actor.
- [x] Check catalog UI merge status before shared-helper extraction.
- [x] Run check, database and integration suites on the isolated inventory verification stack with its own lock, leaving the events stack and lock untouched.
- [x] Review diff, commit, push, open PR into rework with required four sections; write handover.

## Handover status

PR: https://github.com/vale290702/Snackyzz/pull/32 into `rework`.

All required checks pass: `npm run check` (223 unit/component tests and production build), `npm run test:db` against the isolated verification workdir (386 assertions), and `npx vitest run --project integration` (91 tests). Types were regenerated from the isolated database with no source changes. Static review completed; ADR 0012 addresses its finding.

To avoid interfering with the concurrent events session, validation used project `snackyzz-inventory-verification`, ports 563xx, and `/private/tmp/snackyzz-inventory-verification`. Runtime configuration and credentials are excluded from commits; the repository retains standard project/port configuration. The separate verification lock and shared coordination notes live in `/private/tmp/snackyzz-rework-notes`. Docker required recovery after disk-space errors; volumes were preserved.

Catalog UI #31 remains open, so the requested shared-helper extraction is deferred to a follow-up commit after it merges and inventory rebases. Orders reservation/release/references and UI remain deferred as specified.
