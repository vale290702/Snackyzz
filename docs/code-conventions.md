# Code conventions

This is the canonical convention reference required by root `AGENTS.md`. Directory guides describe local APIs and invariants, not alternative naming styles. When changing a convention, update its examples and lint configuration in the same change.

## Layout and names

Group files by purpose inside the existing architectural layers. Create only the files a purpose needs; do not scaffold empty layers or introduce a class per file just for symmetry.

```text
features/orders/
  index.ts                         # deliberate external API; no repositories
  domain/cancellation/
    cancellation.schema.ts         # Zod input; inferred types in .types.ts
    cancellation.types.ts
    cancellation.constants.ts
  server/cancellation/
    index.ts                       # internal group exports
    cancellation.capability.ts     # permission → parse → execute
    cancellation.actions.ts        # web entry point; 'use server'
    cancellation.repository.ts     # database access
    cancellation.repository.int.test.ts
shared/lib/result/
  index.ts
  result.helper.ts                 # Results.ok / Results.err
  result.types.ts
  result.constants.ts
  result.helper.test.ts
```

Every new implementation filename has a role suffix. Use `.helper`, `.factory`, `.runner`, `.service`, `.loader`, `.repository`, `.schema`, `.capability`, `.actions`, `.query`, `.job`, `.adapter`, `.hook`, or `.component`; declarations use `.types`, `.constants`, or `.enum`, before `.ts`/`.tsx`. Tests preserve the role, followed by `.test` or `.int.test`. Use `index.ts` for explicit exports; never mix browser and server-only exports.

Exceptions: framework/tool-required filenames, generated files, and existing shadcn UI and foundation config/i18n filenames retain their established paths. New feature hooks/components use `use-checkout.hook.ts` / `checkout.component.tsx`. Do not rename unrelated existing modules merely to satisfy this convention. ESLint enforces filenames in shared/lib, integrations and feature domain/server/hooks/ui code; existing foundation UI/config/i18n and generated DB types are excluded.

Use descriptive variables, parameters and generics (`Value`, `ErrorCode`, `InputSchema`, not `T`, `E`, `S`). Semantic values such as error codes, outcomes, channels and shared routes use named constants or enums. Prefer `as const` objects when literal unions are useful. Database column selectors, import paths, schema keys and independent test expectations may stay literal; extracting every string creates noise.

## Responsibilities and callable APIs

- Put contracts in `.types.ts`, runtime schemas in `.schema.ts`, semantic constants in `.constants.ts`, and behavior in its role file. Infer types from schemas/generated types instead of duplicating fields.
- Stateless reusable helpers use a focused static class: `Results.ok(value)`, `Mask.email(email)`. No instances, inheritance or generic `Utils` class. Existing `cn()` and compatibility aliases retain their APIs.
- Operation entry points, React hooks, factories and orchestration stay named functions: `runAction`, `defineCapability`, `createLogger`, `getAdminContext`. Do not wrap these in classes just to namespace a single operation.
- A factory may close over a client or context and return a small object. Do not introduce dependency containers or interfaces without an actual boundary or test seam.

## Readability before abstraction

Write one paragraph per logical step, with early returns. Parse external input once with Zod; trust the resulting types. Do not add repeated `typeof` checks or generic normalization pipelines for typed internal values. Unknown errors still need a small, explicit boundary parser; never expose raw error messages or payloads in logs.

Extract a helper when it names a real responsibility or removes meaningful duplication. A helper that only forwards arguments, or fragments a short linear operation across files, needs a concrete reason. File separation is not a reason to split every branch into another method. Functions remain at most 50 lines; splitting must improve the reader's understanding.

Use multiline JSDoc even for short descriptions:

```ts
/**
 * Masks a contact address for diagnostic output.
 * @param email Address to mask.
 * @returns An address with its local part hidden.
 */
static email(email: string): string {
  // Implementation belongs in Mask, not an extra forwarding wrapper.
}
```

## Review and enforcement

Before finishing, inspect the changed files for descriptive names, purposeful grouping, multiline docs, named semantic values, straightforward control flow and matching tests. Check local guides against the actual public API. Keep tests inside their relevant `describe` blocks.

`npm run lint` checks role suffixes in the scoped layers, single-letter generic names and multiline JSDoc in hand-written source, alongside existing size/import rules. It cannot prove meaningful names, SRP or simplicity: those remain required review checks. `npm run test:tooling` regression-tests the lint configuration; `npm run check` includes it. No new dependency is needed.
