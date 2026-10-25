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

## Forms and Server Actions

Every form that submits to a Server Action follows one recipe. The shared pieces are `useFormAction` and `FormInput` (`@/shared/lib/form-action`) and `useErrorMessage` (`@/i18n/use-error-message.hook`); [ADR 0010](adr/0010-form-hooks-on-use-form-action.md) records why. Reference implementation: `features/access` sign-in (`domain/sign-in/`, `server/sign-in/`, `hooks/sign-in/`, `ui/sign-in/`).

### Recipe

1. **Domain schema** in `domain/<purpose>/<purpose>.schema.ts`: a `z.object` whose keys are the form's `name` attributes. Every issue message is an error code from `<purpose>.constants.ts`, never copy: `z.email({ error: SignInFieldError.EmailInvalid })`. Object-level rules (`.refine`) also use a code; they show as the form error. The schema must stay client-safe (no `server-only`, env or I/O).
2. **Error codes and copy**: field codes in `domain/<purpose>/<purpose>.constants.ts`, action failures in `domain/errors/errors.constants.ts`. Add copy for both under `errors.<feature>` in `errors.json`, and extend the feature's key test in `src/i18n/messages.test.ts`.
3. **Server Action** in `server/<purpose>/<purpose>.actions.ts` (`"use server"`): takes `input: unknown`, re-parses it with the same schema inside `runAction` (or the capability does, for admin actions), and returns `ActionResult<Value, ErrorCode>`. It never trusts the hook's parse. Redirects happen after `runAction`, on success.
4. **Feature hook** in `hooks/<purpose>/use-<component>.hook.ts` (`"use client"`): calls `useFormAction` and `useErrorMessage`, and returns flat, named, already-translated fields for its one component. No other state machinery.
5. **Component** in `ui/<purpose>/<component>.component.tsx`: `<form action={formAction}>`, inputs whose `name` matches the schema keys, `defaultValue` from the restored values, `aria-invalid` / `aria-describedby` for field errors, and a `role="alert"` element for the form error. It never imports the Server Action.

```ts
export function useSignInForm() {
  const form = useFormAction({
    schema: signInInputSchema,
    action: signInAction,
    fieldErrorCodes: Object.values(SignInFieldError),
    preserve: ["email"],
  });
  const errorMessage = useErrorMessage("access");

  return {
    formAction: form.formAction,
    isPending: form.isPending,
    email: form.values.email ?? "",
    emailError: errorMessage(form.fieldErrors.email),
    passwordError: errorMessage(form.fieldErrors.password),
    formError: errorMessage(form.formError),
  };
}
```

A form with no fields (a sign-out or "retry" button) passes `schema: FormInput.none` and reads only `formError`.

### What `useFormAction` does

On each submission it copies the `preserve` fields' raw text, reads every schema key from `FormData`, and parses it. Invalid input becomes an `invalid` state (one code per field, plus any object-level code as `formError`) and the action is **not** called. Valid input goes to the action; its `Result` becomes `failed` (`formError` is its code) or `succeeded` (`state.value`). It returns `{ formAction, isPending, state, values, fieldErrors, formError }`; `state` is the full `FormActionState` union (`FormActionStatus.Idle | Invalid | Failed | Succeeded`) for hooks that need to react to success, for example to close a dialog or show a toast.

### Rules

- **Codes in, copy out.** `useFormAction` deals in codes only; the feature hook translates with `useErrorMessage("<feature>")`, which reads `errors.shared` for `SharedError` codes and `errors.<feature>` otherwise. Its parameter type is the namespace's keys, so a code without copy fails `npm run typecheck`.
- **List every field code** in `fieldErrorCodes`. An issue message outside the list (Zod's own type errors, a missing field) shows as `invalid_input`.
- **`preserve` is explicit and never holds secrets.** React resets a form after its action runs; list the fields the user should not retype after a failure (email, name, address). Never passwords, tokens or payment data.
- **Progressive enhancement.** Submit through `<form action>`, not `onSubmit` + `fetch`, so the form works before hydration. Native constraints (`type="email"`, `required`) stay on the inputs; the schema is the source of truth.
- **One hook, one component.** Do not return `form` itself or the raw `state` to the component unless it renders by status; return the named fields it uses.
- **Extend, don't fork.** A form that needs something new (multi-value fields such as checkbox groups, file uploads, nested objects, optimistic UI) extends `FormInput` / `useFormAction` in `shared/lib/form-action` with tests and updates this section. Do not hand-roll `useActionState` for a form, and do not add React Hook Form, TanStack Form or shadcn `Form` without a new ADR.
- **Not a form?** Buttons that mutate without a form (toggles, drag and drop) call the Server Action from the hook inside `useTransition` and translate its `Result` with `useErrorMessage`.

### Testing

- `<purpose>.schema.test.ts` (unit): each code is reported for its field.
- `use-<component>.hook.test.tsx` (dom): `renderHook` with a `NextIntlClientProvider` wrapper and the action module mocked; submit with `act(async () => startTransition(() => result.current.formAction(formData)))`. Cover: initial state, invalid input (action not called, translated field errors, preserved values), an action failure (translated form error), a shared failure, and pending.
- `<purpose>.actions.int.test.ts` (integration): the action against the local stack with malformed `unknown` input as well as valid input.
- e2e for the user journey when the form is part of one.

### Done checklist

- [ ] Schema messages are codes; every code has copy and the key test covers it.
- [ ] The action takes `unknown`, re-parses, and runs in `runAction` (and a capability for admin actions).
- [ ] The hook uses `useFormAction` + `useErrorMessage`; `preserve` lists no secrets.
- [ ] The component uses `<form action>`, `name` = schema keys, `defaultValue`, `aria-invalid` / `aria-describedby`, `role="alert"`.
- [ ] Hook, schema and action tests from the list above.
