# Snackyzz

Cookie storefront and admin panel for Snackyzz. This branch is the **rework**: a ground-up rebuild with the same functionality (see `docs/rebuild/`). The previous app lives on `main` until cutover.

## Stack

Next.js 16 (App Router, Cache Components) · React 19 · TypeScript (strict) · Tailwind CSS v4 + shadcn/ui · next-intl (es-CR) · Supabase (Postgres, Auth, Storage) · Vitest · Playwright · pgTAP.

## Getting started

Requires Node 22.12+ and Docker (for the local Supabase stack).

```bash
nvm use
npm install
npm run db:start
cp .env.example .env.local
npm run dev
```

Fill `.env.local` from the output of `supabase status`. The app runs on http://127.0.0.1:5174.

## Scripts

| Command                   | What it does                                                    |
| ------------------------- | --------------------------------------------------------------- |
| `npm run dev`             | Next dev server                                                 |
| `npm run check`           | typecheck, lint, format check, unit tests and build (CI parity) |
| `npm run test:unit`       | Unit and component tests                                        |
| `npm run test`            | All Vitest projects, including integration (needs the DB)       |
| `npm run test:db`         | pgTAP database tests                                            |
| `npm run test:e2e`        | Playwright journeys                                             |
| `npm run db:diff -- name` | Generate a migration from `supabase/schemas`                    |
| `npm run db:types`        | Regenerate `src/integrations/supabase/database.types.ts`        |

## Where things are

- `AGENTS.md`: rules for humans and coding agents. Every directory that matters has its own `AGENTS.md`.
- `docs/rebuild/`: decisions, ER design, architecture and directory structure for the rework.
- `docs/adr/`: architecture decision records. `docs/domain/`: glossary and order lifecycle.
- `DESIGN.md` / `PRODUCT.md`: design system and product principles.

## Contributing

Branch off `rework` with an action prefix (`feat/`, `fix/`, `refactor/`, `chore/`, `docs/`, `test/`), use Conventional Commits, and open the PR against `rework`. Husky runs lint-staged and commitlint on commit, and typecheck plus unit tests on push.
