<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Snackyzz: Agent Guidelines

Snackyzz is a small Costa Rican cookie shop: a storefront (catalog, cart, checkout with SINPE Móvil proof upload, pickup or delivery) and an admin panel (order review, catalog, inventory, locations, delivery, notifications). Primary brand Snackyzz; collab brands are data. Stack: Next.js 16 (App Router) · React 19 · TypeScript · Tailwind v4 + shadcn/ui · next-intl · Supabase (Postgres, Auth, Storage) · Vercel.

These rules apply to every agent (Claude Code, Codex) and every human. Directory-level `AGENTS.md` files add local rules; when they conflict, the more specific file wins.

## Read before coding

1. The `AGENTS.md` of every directory you'll touch.
2. [`docs/domain/glossary.md`](docs/domain/glossary.md): use these names, no synonyms.
3. For order, payment or stock work: [`docs/domain/order-lifecycle.md`](docs/domain/order-lifecycle.md).
4. For schema work: [`docs/rebuild/02-er-design.md`](docs/rebuild/02-er-design.md). For cross-feature work: [`docs/rebuild/03-architecture.md`](docs/rebuild/03-architecture.md).
5. For Next.js APIs: the guide in `node_modules/next/dist/docs/` (see top of this file).

## Principles, in priority order

When two conflict, the higher one wins.

1. **Correctness & data integrity**: money, stock and order state are never wrong, even under retries and concurrency.
2. **Security**: least privilege, authorize every entry point, never trust the client.
3. **Simplicity**: the least machinery that is correct (KISS, YAGNI). This is a low-volume local shop.
4. **Readability**: code is read by two humans and two agent families; optimize for the next reader.
5. **Testability**
6. **Performance**
7. **Extensibility**: leave clear seams, but don't build for imagined requirements.
8. **DRY**: duplication beats the wrong abstraction. Abstract on the third occurrence.

Design principles we apply:

- **Deep modules.** Small interfaces that hide real complexity. A feature's `index.ts` exports few things that do a lot.
- **Functional core, imperative shell.** Business rules are pure functions in `domain/`; I/O lives in `server/` and `integrations/`.
- **Parse, don't validate.** Turn untrusted input into typed values once, at the boundary, with Zod. Inside, trust the types.
- **Make illegal states unrepresentable.** Discriminated unions in TS; constraints, enums and composite FKs in SQL.
- **SOLID, pragmatically.** Single responsibility per module; depend on interfaces only at real seams (channels, providers). No interface with one implementation unless it's a test seam.
- **Composition over inheritance.** Inheritance is only allowed for framework requirements.
- **Explicit over implicit.** No business side effects in triggers, getters, constructors or module top level.
- **Rule of three** before extracting a shared abstraction.

## Architecture in one screen

- **Vertical slices**: `src/features/<feature>/{domain,server,hooks,ui}` + `index.ts` (public API). Routes in `src/app` are thin and compose features. Components render; hooks hold their logic.
- **Where logic lives**: apply the first rule that matches.
  1. Atomic or concurrent invariant → SQL entry-point function.
  2. Integrity rule → DB constraint + Zod schema.
  3. Authorization → `requirePermission()` in TS **and** RLS / `has_permission` in SQL.
  4. Pure business rule → `domain/`.
  5. External system → `src/integrations/` adapter.
  6. Use-case orchestration → `server/` action or job.
- **Data access** only through `server/repository.ts` of the owning feature. No `supabase.from()` anywhere else.
- **Features import each other only via `index.ts`.** `domain/` imports no I/O. `shared/` imports no features. ESLint enforces this.
- **Admin actions are capabilities** (`defineCapability` in `features/<x>/server/capabilities.ts`): permission + Zod input + `execute`, defined once. Web Server Actions and the Telegram bot (`admin-chat`) both call them, so no front end can skip a check.
- **Every mutation is a Server Action** wrapped in `runAction()`: authorize → parse → execute (inside the capability for admin actions) → invalidate (`updateTag`) → side effects in `after()`.
- **Features publish events** with `private.publish_event` in the same transaction as the change. Other features react by consuming `events.domain_events`, never by being called from the publisher.

## Code standards

**Readability & formatting**

Code is written for the next reader. Dense, unbroken blocks are rejected in review even when they work.

- Prettier formats everything (TS, CSS, JSON, SQL via `prettier-plugin-sql`). Never fight it by hand.
- One statement per line. Split a function into **paragraphs** separated by a blank line, one per logical step (e.g. authorize · parse · execute · respond).
- Prefer early returns over nested `if`/`else`. No nested ternaries.
- Name intermediate values instead of chaining or nesting long expressions.
- Objects, parameter lists and JSX props with more than three entries go on multiple lines.
- No end-of-line comments narrating steps. Well-named functions and variables replace them.
- Imports in three groups separated by blank lines: packages, `@/` aliases, relative (ESLint `import/order`).
- SQL follows the style in `docs/rebuild/02-er-design.md` §13: lowercase keywords, one column/condition per line, blank lines between statements.

```ts
// ✗ Rejected: everything packed together, intent hidden
export async function cancel(i: unknown) { const a = await requirePermission("orders.decide"); const p = schema.safeParse(i); if (!p.success) return err("invalid_input"); const r = await repo(a.client).transition({ ...p.data, to: "cancelled" }); if (r.ok) updateTag(tags.order(r.value.id)); return r; }

// ✓ Accepted: one step per paragraph, names that explain
export async function cancelOrderAction(input: unknown): Promise<ActionResult<OrderDto>> {
  return runAction("orders.cancel", async (log) => {
    const context = await getAdminContext({ source: "admin_web" });

    const parsed = cancelOrderInput.safeParse(input);
    if (!parsed.success) {
      return err("invalid_input");
    }

    const result = await transitionOrder.run(context, {
      ...parsed.data,
      toStatus: "cancelled",
    });
    if (!result.ok) {
      return result;
    }
    log.step("cancelled", { orderId: result.value.id });

    updateTag(orderTags.detail(result.value.id));
    return result;
  });
}
```

**Components and hooks**

Components only render. Hooks hold the logic components need.

| Layer | Responsibility | Must not |
|---|---|---|
| `features/<x>/ui/*.tsx` (component) | Markup, styling, accessibility, wiring events to the handlers a hook returns | Fetch data, call Server Actions, hold business rules, compute derived business values, use `useEffect` for logic |
| `features/<x>/hooks/use-*.ts` (hook) | Client state, derived values (via `domain/` functions), event handlers, Server Action calls (`useActionState`, `useTransition`), optimistic updates, `localStorage` | Render JSX or know about styling |
| `app/**/page.tsx` (route) | Load data on the server through feature queries and pass DTOs as props | Contain logic beyond loading data and composing components |

- One hook per interactive component, named after it: `CheckoutForm` ↔ `useCheckoutForm`. It returns a typed object (`{ state, actions }` or flat named fields).
- Server Components in `ui/` receive data **as props**; they don't call queries themselves.
- Pure, non-React logic belongs in `domain/`, not in a hook. A hook orchestrates; it doesn't calculate.
- Test hooks with `renderHook` (behavior). Test components only for rendering and accessibility.

```tsx
export function CheckoutForm({ context }: CheckoutFormProps) {
  const { fields, errors, isSubmitting, submit } = useCheckoutForm(context);
  const t = useTranslations("checkout");

  return (
    <form onSubmit={submit} className="flex flex-col gap-6">
      <ContactFields values={fields.contact} errors={errors.contact} />
      <FulfillmentPicker value={fields.fulfillment} options={context.fulfillment} />
      <Button type="submit" disabled={isSubmitting}>
        {t("submit")}
      </Button>
    </form>
  );
}
```

**TypeScript**
- `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noImplicitOverride` are on. Don't weaken them.
- No `any`; use `unknown` and parse. Non-null `!` only with a `// why` comment.
- Types come from Zod (`z.infer`) or generated DB types, never hand-duplicated.

**Size limits** (split before you exceed them)
- File ≤ 300 lines · function ≤ 50 lines · component ≤ 150 lines · JSX nesting ≤ 3 levels before extracting.

**Naming**
- Glossary terms only. Files `kebab-case`, components `PascalCase`, hooks `use-*.ts`, actions `<verb><Noun>Action`, SQL entry points `<schema>.<verb>_<noun>`.
- Code, URLs, DB and logs in **English**. User-facing copy in **Spanish via next-intl**, never inline.

**Errors**
- Expected failures return `Result<T, ErrorCode>` (`ok()` / `err()` from `shared/lib/result`). Error codes live in each feature's `domain/errors.ts`; copy lives in `i18n/messages/es-CR/errors.json`.
- `throw` only for bugs. Never show raw error messages to users.

**Logging**
- Use `shared/lib/logger` only (no `console.*`). In actions and jobs, log every named step with `log.step()`.
- Never log secrets, tokens, proof URLs, or unmasked emails/phones.

**Comments & JSDoc**
- Comments explain *why*, never *what*.
- Exported functions and components get JSDoc with `@param` / `@returns` (and `@throws` when relevant). One or two short sentences, no multi-paragraph blocks, no code references.

```ts
/**
 * Lists the delivery windows a customer can pick from.
 * @param input Schedule, lead and slot settings, and the current time.
 * @returns Windows in chronological order, empty when delivery is closed.
 */
export function listDeliveryWindows(input: DeliveryWindowInput): DeliveryWindow[] {
```

**UI**
- Compose `src/shared/ui` (shadcn) components; style with Tailwind token classes only. No hex values, no arbitrary values unless a token is missing; if one is, add the token.
- Server Components by default; `'use client'` at the smallest leaf that needs it.
- Accessible by default (WCAG 2.2 AA): semantic elements, labelled inputs, visible focus, keyboard paths.

**Database**
- Edit `supabase/schemas/**`, then generate the migration with `supabase db diff`. Never hand-edit generated migrations. Reference data goes in `*_data.sql` migrations.
- Follow the conventions in `supabase/AGENTS.md`. Every new table gets RLS, grants, indexes on FKs, and pgTAP tests.
- Regenerate `src/integrations/supabase/database.types.ts` after every schema change.

## Testing

| Change | Required test |
|---|---|
| `domain/` logic | Unit test, written first (TDD) |
| `hooks/` | `renderHook` test of state transitions and handlers |
| `server/` action, query, repository | Integration test against local Supabase (`*.int.test.ts`) |
| SQL function, constraint, RLS policy | pgTAP in `supabase/tests/` |
| Checkout, admin decision, or another user journey | Playwright in `tests/e2e/` |

No skipped or `.only` tests in commits. Use fixtures from `tests/fixtures`, not production data.

## Definition of Done

- [ ] `npm run check` passes (typecheck, lint, format, unit, build).
- [ ] `npm run test:db` and the relevant `npm run test:e2e` specs pass locally when DB or journeys changed.
- [ ] New behavior has tests per the table above.
- [ ] Migration generated from the declarative schema; DB types regenerated.
- [ ] The `AGENTS.md` of each touched directory still tells the truth (public API, invariants, gotchas).
- [ ] No new TODO without an issue link. No stray `console.*`.
- [ ] UI changes: screenshot in the PR.
- [ ] An ADR exists if the change needs one (see below).

## Stop and ask

Stop and ask a human before:
- changing schema shape (tables, columns, enums, constraints);
- changing money, stock, payment, refund or order-state logic;
- touching auth, sessions, RLS, grants or permissions;
- adding a dependency;
- changing a feature's public API that two or more features use;
- breaking an import boundary.

**Always include a recommendation.** Use this format:

> **Question:** … **Options:** A) … B) … **Recommendation:** A, because … **Impact if wrong:** …

## Never

- Hand-edit generated migrations or `database.types.ts`.
- Use the service-role client outside `server/` code that has already authorized, or expose it to the browser.
- Disable RLS, or grant table-level writes on orders, payments, refunds, events or stock.
- Deep-import another feature (`features/x/server/...`), or call `supabase.from()` outside a repository.
- Read `process.env` outside `shared/config`.
- Hard-code user-facing text, colors or prices.
- Trust client-sent prices, totals, fees, stock or status.
- Commit secrets, `.env*` (except `.env.example`), or real customer data.
- Add a dependency without stating why in the PR.

## ADRs

Write `docs/adr/NNNN-title.md` (context · decision · alternatives · consequences) for refactors, design changes, complex features, schema changes, architectural changes and new dependencies. Status starts `proposed`. Approver: **Alejandro Loaiza**.

## Git & PRs

- **During the rework, `rework` is the integration branch.** Branch every work item off `rework` and open its PR against `rework`, not `main`. When the rework is complete, one PR merges `rework` into `main`. After that, branch from `main` again.
- Branch names use an action prefix: `feat/`, `fix/`, `refactor/`, `chore/`, `docs/`, `test/` (e.g. `feat/orders-schema`). No agent-name prefixes.
- Conventional Commits (`feat(orders): add cancel transition`), enforced by commitlint.
- Hooks: pre-commit runs lint-staged; pre-push runs typecheck + unit tests. Don't bypass with `--no-verify`.
- Fill in the PR template. Work-item PRs are **squash merged** into `rework`. The final `rework → main` PR uses a **merge commit**, so each work item stays a separate commit in `main`'s history.
- Before starting a work item, pull the latest `rework`. Merge `main` into `rework` after anything lands on `main` (hotfixes to the current app), so the final PR stays clean.

## Commands

```bash
npm run dev          # Next dev server
npm run check        # typecheck + lint + format:check + test + build
npm run test         # unit + integration (vitest)
npm run test:db      # pgTAP (supabase test db)
npm run test:e2e     # Playwright
npm run db:diff      # generate a migration from supabase/schemas
npm run db:types     # regenerate database.types.ts
```
