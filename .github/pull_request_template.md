## What & why

<!-- One or two sentences. Link the issue or ADR. -->

## How it was tested

<!-- Commands run, new tests, screenshots for UI changes. -->

## UI parity

<!-- UI changes only (docs/rebuild/05-ui-parity.md). Before/after screenshots at phone and desktop width: the `main` screen next to the rebuilt one. Delete if no UI changed. -->

**Deviations:** <!-- Each visible difference from `main` and why: new functionality, or the UX gain. "None" if none. -->

## Checklist

- [ ] `npm run check` passes
- [ ] `npm run test:db` / `npm run test:e2e` run locally if DB or user journeys changed
- [ ] Tests added for new behavior (unit / integration / pgTAP / e2e)
- [ ] Migration generated from `supabase/schemas` and DB types regenerated (if schema changed)
- [ ] `AGENTS.md` updated in every directory whose public API, invariants or gotchas changed
- [ ] UI matches `main` (screenshots above), or every deviation is listed and justified
- [ ] ADR added or updated (refactor, design change, complex feature, schema, dependency)
- [ ] New dependencies justified below

## New dependencies

<!-- Name · why · alternatives considered. Delete if none. -->
