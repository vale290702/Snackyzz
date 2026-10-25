## What & why

<!-- One or two sentences. Link the issue or ADR. -->

## How it was tested

<!-- Commands run, new tests, screenshots for UI changes. -->

## Checklist

- [ ] `npm run check` passes
- [ ] `npm run test:db` / `npm run test:e2e` run locally if DB or user journeys changed
- [ ] Tests added for new behavior (unit / integration / pgTAP / e2e)
- [ ] Migration generated from `supabase/schemas` and DB types regenerated (if schema changed)
- [ ] `AGENTS.md` updated in every directory whose public API, invariants or gotchas changed
- [ ] ADR added or updated (refactor, design change, complex feature, schema, dependency)
- [ ] New dependencies justified below

## New dependencies

<!-- Name · why · alternatives considered. Delete if none. -->
