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
4. **Feature hook** in `hooks/<purpose>/use-<component>.hook.ts` (`"use client"`): binds the schema, the action, the field codes and `preserve` by returning `useFormAction({ … })`. It is the only place that imports the Server Action. It returns codes, never copy; add fields only for real client logic (derived values, extra handlers).
5. **Component** in `ui/<purpose>/<component>.component.tsx`: calls its hook and `useErrorMessage("<feature>")`, then renders `<form action={formAction}>`, inputs whose `name` matches the schema keys, `defaultValue` from `values`, `aria-invalid` / `aria-describedby` for field errors, and a `role="alert"` element for the form error. It never imports the Server Action.

```ts
export function useSignInForm() {
  return useFormAction({
    schema: signInInputSchema,
    action: signInAction,
    fieldErrorCodes: Object.values(SignInFieldError),
    preserve: ["email"],
  });
}
```

```tsx
export function SignInForm() {
  const { formAction, isPending, values, fieldErrors, formError } = useSignInForm();
  const translate = useTranslations("access.signIn");
  const errorMessage = useErrorMessage("access");

  const emailError = errorMessage(fieldErrors.email);

  return (
    <form action={formAction} aria-labelledby="sign-in-title">
      {/* … */}
      <Input
        name="email"
        defaultValue={values.email ?? ""}
        aria-invalid={Boolean(emailError)}
        aria-describedby={emailError ? EMAIL_ERROR_ID : undefined}
      />
      <FieldError id={EMAIL_ERROR_ID}>{emailError}</FieldError>
    </form>
  );
}
```

A form with no fields (a sign-out or "retry" button) passes `schema: FormInput.none` and reads only `formError`.

Fields that are not plain text are listed in `fieldKinds`. A `FormFieldKind.Checkbox` field becomes `true` when it was submitted at all and `false` otherwise (an unchecked box submits nothing), so its schema is `z.boolean()`. A `FormFieldKind.List` field becomes every text entry under its name, in order, or `[]`, for checkbox groups and multi-selects; its schema is `z.array(…)`. Every other field reads its first entry.

```ts
return useFormAction({
  schema: productInputSchema,
  action: createProductAction,
  fieldErrorCodes: Object.values(CatalogFieldError),
  preserve: ["slug", "name", "description"],
  fieldKinds: { categoryIds: FormFieldKind.List },
});
```

`preserve` restores text only. Keep checkbox, list and select choices the user should not redo after a failure in the hook's state and render those controls controlled; React's form reset leaves controlled values alone.

### What `useFormAction` does

On each submission it copies the `preserve` fields' raw text, reads every schema key from `FormData` (by its `fieldKinds` entry, text by default), and parses it. Invalid input becomes an `invalid` state (one code per field, plus any object-level code as `formError`) and the action is **not** called. Valid input goes to the action; its `Result` becomes `failed` (`formError` is its code) or `succeeded` (`state.value`). It returns `{ formAction, isPending, state, values, fieldErrors, formError }`; `state` is the full `FormActionState` union (`FormActionStatus.Idle | Invalid | Failed | Succeeded`) for hooks or components that render by status, or react to success (close a dialog, show a toast).

### Rules

- **Hooks return codes; components translate.** Code → copy is presentation, like labels: the component calls `useErrorMessage("<feature>")` next to `useTranslations`. The hook never translates, so hook tests assert codes. `useErrorMessage` which reads `errors.shared` for `SharedError` codes and `errors.<feature>` otherwise. Its parameter type is the namespace's keys, so a code without copy fails `npm run typecheck`.
- **List every field code** in `fieldErrorCodes`. An issue message outside the list (Zod's own type errors, a missing field) shows as `invalid_input`.
- **`preserve` is explicit and never holds secrets.** React resets a form after its action runs; list the fields the user should not retype after a failure (email, name, address). Never passwords, tokens or payment data.
- **Progressive enhancement.** Submit through `<form action>`, not `onSubmit` + `fetch`, so the form works before hydration. Native constraints (`type="email"`, `required`) stay on the inputs; the schema is the source of truth.
- **One hook, one component.** The hook is named after its component and returns `useFormAction`'s object as is; don't rename or re-map its fields. A hook with extra client logic spreads it and adds named fields: `return { ...form, canSubmit }`.
- **Extend, don't fork.** A form that needs something new (file uploads, nested objects, optimistic UI) extends `FormInput` / `useFormAction` in `shared/lib/form-action` with tests and updates this section. Do not hand-roll `useActionState` for a form, and do not add React Hook Form, TanStack Form or shadcn `Form` without a new ADR.
- **Not a form?** Buttons that mutate without a form (toggles, drag and drop) call the Server Action from the hook inside `useTransition`, return the `Result` code, and the component translates it with `useErrorMessage`.

### Testing

- `<purpose>.schema.test.ts` (unit): each code is reported for its field.
- `use-<component>.hook.test.tsx` (dom): `renderHook` with the action module mocked (no intl wrapper needed); submit with `act(async () => startTransition(() => result.current.formAction(formData)))`. Cover: initial state, invalid input (action not called, field codes, preserved values, secrets not preserved), an action failure (its code), and pending.
- `<component>.component.test.tsx` (dom): mock the hook module and render inside `NextIntlClientProvider` with the `es-CR` messages. Cover: translated field errors linked to their inputs (`toHaveAccessibleDescription`, `aria-invalid`), the restored `defaultValue`, and the translated `role="alert"` form error, including a shared code.
- `<purpose>.actions.int.test.ts` (integration): the action against the local stack with malformed `unknown` input as well as valid input.
- e2e for the user journey when the form is part of one.

### Done checklist

- [ ] Schema messages are codes; every code has copy and the key test covers it.
- [ ] The action takes `unknown`, re-parses, and runs in `runAction` (and a capability for admin actions).
- [ ] The hook returns `useFormAction({ … })` and translates nothing; `preserve` lists no secrets.
- [ ] The component translates with `useErrorMessage` and uses `<form action>`, `name` = schema keys, `defaultValue`, `aria-invalid` / `aria-describedby`, `role="alert"`.
- [ ] Schema, hook, component and action tests from the list above.
