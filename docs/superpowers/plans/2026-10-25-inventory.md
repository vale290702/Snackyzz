# Inventory implementation plan

**Goal:** Build the inventory work item specified by the user, based on ER §8 and §12, without UI or order reservations.

**Architecture:** SQL owns atomic stock changes and pool selection. Domain schemas parse inputs; permissioned capabilities call repositories through Server Actions. Public availability uses an anonymous client and tagged caching.

**Constraints:** No API table writes, generated migrations and types only, no dependencies, functions ≤50 lines, field error codes and Spanish copy. Preserve the concurrent events work and defer catalog/fulfillment extraction until PR #31 merges.

- [x] Fetch origin/rework and create isolated feat/inventory worktree.
- [x] Read repository guides and references; write and run failing stock rule tests.
- [ ] Implement and verify pure stock rules and input schemas.
- [ ] Add declarative 50_inventory schema: levels, append-only movements, private single writer and resolver, authorized admin entry points, anon availability.
- [ ] Generate migration; apply locally; restart API for exposed schema; generate types.
- [ ] Build inventory repositories, capabilities, mutation runner, actions, cached availability, authorized admin reads and error copy.
- [ ] Add pgTAP role/constraint/entry-point tests and integration coverage including concurrency and pg_safeupdate paths.
- [ ] Update guides and ER with orders split; seed through the private writer without actor.
- [ ] Check catalog UI merge status before shared-helper extraction.
- [ ] Run check, database and integration suites while holding shared db-lock.md.
- [ ] Review diff, commit, push, open PR into rework with required four sections; write handover.
