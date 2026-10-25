# src/features

## Purpose
Vertical slices: each folder owns one business capability end to end (rules, data access, UI). Most code lives here.

## Owns / does not own
- **Owns:** business rules, use cases, feature UI, and the DB schema of the same name (`features/catalog` ↔ `catalog.*`).
- **Does not own:** routing (`src/app`), generic UI primitives (`src/shared/ui`), vendor clients (`src/integrations`).

## Anatomy (create only what you need)
```
<feature>/
├─ AGENTS.md      # this template: purpose, owns, public API, invariants, deps, testing, gotchas
├─ CLAUDE.md      # @AGENTS.md
├─ index.ts       # the ONLY import path for other features and app/
├─ domain/        # pure: Zod schemas, types, rules, errors.ts. No I/O, no next/*, no env
├─ server/        # import "server-only": repository.ts, queries.ts, capabilities.ts, actions.ts, jobs.ts
├─ hooks/         # use-*.ts: state, handlers, Server Action calls for one component each
└─ ui/            # components: render only; 'use client' only at leaves
```

## Rules
- `index.ts` exports a small, deliberate API: domain types, queries/actions, top-level UI components. Not repositories.
- `server/repository.ts` is the only place that calls `supabase-js` for this feature, and it returns parsed DTOs.
- **Components render, hooks decide.** A `ui/` component gets everything from its hook (`OrderCard` ↔ `useOrderCard`): state, derived values, handlers. Components never import Server Actions, call `fetch`, or hold business rules. Hooks call `domain/` functions for calculations and never render JSX.
- Server Components in `ui/` receive data as props from the page; only `app/` pages call queries.
- **Admin actions are capabilities** (`server/capabilities.ts`, `defineCapability`): name, permission, Zod input, `execute`. Server Actions and `admin-chat` call `capability.run(context, input)`; never duplicate the logic in either.
- Features that other features react to publish **domain events** from their SQL entry points and own the payload schemas in `domain/events.ts`.
- Every action uses `runAction()`: `requirePermission` (admin) → Zod parse → execute → `updateTag` → `after()` side effects.
- Error codes in `domain/errors.ts`; copy in `src/i18n/messages/es-CR/errors.json` under the feature's key.
- Message namespace = feature name (`useTranslations("catalog")`).

## Allowed dependencies
See the import matrix and the feature dependency graph in `docs/rebuild/04-structure.md`. The graph must stay acyclic; if you need a new edge, stop and ask.

## Adding a feature
1. Create the folder with `AGENTS.md` (copy a sibling's sections), `CLAUDE.md`, `index.ts`.
2. If it owns data: add the `supabase/schemas/<feature>/` folder and add the schema to the exposed list in `config.toml`.
3. Add its message namespace file.
4. Add it to the dependency graph in `04-structure.md`. If the change is non-trivial, write an ADR.

## Testing
Unit tests next to `domain/` files; `*.int.test.ts` next to `server/` files (needs `supabase start`).
