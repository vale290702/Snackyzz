# src/shared

## Purpose

Domain-agnostic building blocks used by many features: UI primitives, small utilities and validated configuration. Nothing here knows what a cookie, order or brand is.

## Owns / does not own

- **Owns:** `ui/` (shadcn/ui components restyled with tokens), `lib/` (result, logger, run-action, money/date formatting helpers, ids, assertions), `config/` (env parsing).
- **Does not own:** anything with business meaning. If a helper mentions a glossary term, it belongs in a feature.

## Public API

- `@/shared/ui/<component>`: `Button`, `Dialog`, `Input`, `Field`, `Select`, `Sheet`, `Table`, `Badge`, `Toast`, …
- `@/shared/lib/cn`: `cn(...classes)` (clsx + tailwind-merge, used by `ui/`)
- `@/shared/lib/result`: `Result`, `ok`, `err`, `isOk`
- `@/shared/lib/logger`: `logger`, `createLogger(context)`, `mask.email()`, `mask.phone()`
- `@/shared/lib/run-action`: `runAction(name, fn)`, `ActionResult`
- `@/shared/lib/capability`: `defineCapability({ name, kind, permission, input, execute })` → `{ run(context, input) }` (checks permission, parses input, then executes), `CapabilityContext`
- `@/shared/config/env.server` (`serverEnv`), `@/shared/config/env.public` (`publicEnv`), `@/shared/config/parse-env` (`parseEnv`). Each feature adds the variables it needs to these schemas and to `.env.example`.

## Invariants

- `shared` never imports from `features`, `app` or `integrations` (ESLint boundary).
- `config/env.server.ts` starts with `import "server-only"`; it's the **only** module that reads secret `process.env` values. `env.public.ts` reads only `NEXT_PUBLIC_*`.
- Env is parsed with Zod at import time; a missing variable fails fast with its name, never its value.
- `ui/` components are added with the shadcn CLI, then restyled with tokens. Track local changes in a comment at the top of the file so they survive regeneration.
- No user-facing strings in `ui/`; components take labels as props or children.

## Testing

Unit tests for every `lib/` module. Component tests for primitives with behavior (keyboard, focus trap).

## Gotchas

- Don't add a helper here "because two features might need it". Wait for the third use (AG-02).
- Money formatting needs the locale; take a formatter from next-intl, don't hard-code `es-CR`.
