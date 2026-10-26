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

Forms where people enter data use React Hook Form through one shared hook, `useServerForm` (`@/shared/lib/server-form`), with copy from `useErrorMessage` (`@/i18n/use-error-message.hook`); [ADR 0013](adr/0013-data-entry-forms-on-react-hook-form.md) records why. Single-button actions (sign out, archive, set default) and sign-in still use `useFormAction` (`@/shared/lib/form-action`, [ADR 0010](adr/0010-form-hooks-on-use-form-action.md)). Reference implementation: `features/catalog` category editor (`domain/categories/`, `server/categories/`, `hooks/manager/use-category-form.hook.ts`, `ui/manager/category-form.component.tsx`).

### Recipe

1. **Domain schema** in `domain/<purpose>/<purpose>.schema.ts`: a `z.object` whose keys are the form's fields. Every issue message is an error code from `<purpose>.constants.ts`, never copy: `z.email({ error: SignInFieldError.EmailInvalid })`. The schema must stay client-safe (no `server-only`, env or I/O).
2. **Error codes and copy**: field codes in `domain/<purpose>/<purpose>.constants.ts`, action failures in `domain/errors/errors.constants.ts`. Add copy for both under `errors.<feature>` in `errors.json`, and extend the feature's key test in `src/i18n/messages.test.ts`.
3. **Server Action** in `server/<purpose>/<purpose>.actions.ts` (`"use server"`): takes `input: unknown`, re-parses it with the same schema inside `runAction` (or the capability does, for admin actions), and returns `ActionResult<Value, ErrorCode>`. It never trusts the client's parse. Writes that belong together go to one action, not several calls from the browser.
4. **Feature hook** in `hooks/<purpose>/use-<component>.hook.ts` (`"use client"`): returns `useServerForm({ schema, values, action, fieldErrorCodes, onSuccess, onDirtyChange })`, spread with any real client logic. `values` are the record's current values (or a new record's defaults) for every schema key. It is the only place that imports the Server Action. Controls that aren't native inputs (Radix selects, checkboxes, radio groups, uploads) get `useController` here, and the hook returns their value and change handler.
5. **Component** in `ui/<purpose>/<component>.component.tsx`: calls its hook and `useErrorMessage("<feature>")`, then renders `<form onSubmit={submit}>`, native inputs with `{...form.register("field")}`, controlled Radix controls with the hook's handlers, `aria-invalid` / `aria-describedby` for field errors, and a `role="alert"` element for the form error. It never imports the Server Action.

```ts
export function useCategoryForm({ category, onSaved, onDirtyChange }: CategoryFormOptions) {
  return useServerForm({
    schema: categoryInputSchema,
    values: {
      name: category?.name ?? "",
      slug: category?.slug ?? "",
      sortOrder: category?.sortOrder ?? 0,
    },
    action: (input) =>
      category ? updateCategoryAction({ ...input, id: category.id }) : createCategoryAction(input),
    fieldErrorCodes: Object.values(CatalogFieldError),
    onSuccess: onSaved,
    onDirtyChange,
  });
}
```

```tsx
export function CategoryForm({ category, onSaved }: CategoryFormProps) {
  const { form, submit, isSubmitting, fieldErrors, formError } = useCategoryForm({ category, onSaved });
  const errorMessage = useErrorMessage("catalog");

  return (
    <form onSubmit={submit} aria-busy={isSubmitting}>
      <TextField id="category-name" label={…} error={errorMessage(fieldErrors.name)} {...form.register("name")} />
      <FormAlert message={errorMessage(formError)} />
      {/* … */}
    </form>
  );
}
```

### What `useServerForm` does

It creates the form with `zodResolver(schema)`. On submit, React Hook Form parses the values; invalid input shows field errors and the action is **not** called. Valid input goes to the action; a failed `Result` becomes `formError` (its code), a thrown call becomes `unexpected`, and success calls `onSuccess(value)`. When `values` change (the records refreshed after a save), the form takes them and keeps the fields the user changed. `onDirtyChange` hears every change of `isDirty`, and `false` on unmount. It returns `{ form, submit, isSubmitting, fieldErrors, formError }`; `fieldErrors` holds one code per invalid field.

### Rules

- **Hooks return codes; components translate.** Code → copy is presentation, like labels: the component calls `useErrorMessage("<feature>")` next to `useTranslations`. Its parameter type is the namespace's keys, so a code without copy fails `npm run typecheck`.
- **List every field code** in `fieldErrorCodes`. An issue message outside the list (Zod's own type errors) shows as `invalid_input`.
- **The form owns every value.** No hidden inputs, no `key` remounts to reset values, no DOM `change` listeners for dirty state; read `formState.isDirty` through `onDirtyChange`. Use `useWatch` or `useController`, never `watch`, so a field change doesn't re-render the whole form.
- **JavaScript required.** These forms submit through `onSubmit`. A customer-facing form keeps its submit button disabled until hydrated, so a native submit never puts personal data in the URL.
- **One hook, one component.** The hook is named after its component and returns `useServerForm`'s object, spread with extra fields: `return { ...server, canSubmit }`.
- **Single buttons stay on `useFormAction`.** A form with no fields (a sign-out or "archive" button) uses `<form action>` with `useFormAction({ schema: FormInput.none, action })` and reads only `formError`.
- **Not a form?** Buttons that mutate without a form (reordering) call the Server Action from the hook inside `useTransition`, return the `Result` code, and the component translates it with `useErrorMessage`.

### Testing

- `<purpose>.schema.test.ts` (unit): each code is reported for its field.
- `use-<component>.hook.test.tsx` (dom): `renderHook` with the action module mocked (no intl wrapper needed); set values with `act(() => result.current.form.setValue(…))` and submit with `await act(() => result.current.submit())`. Cover: the parsed input sent to the action, invalid input (action not called, field codes, typed values kept), an action failure (its code), and refreshed `values`.
- `<component>.component.test.tsx` (dom): mock the action module and render inside `NextIntlClientProvider` with the `es-CR` messages. Cover: labels, translated field errors linked to their inputs (`toHaveAccessibleDescription`, `aria-invalid`), and the translated `role="alert"` form error.
- `<purpose>.actions.int.test.ts` (integration): the action against the local stack with malformed `unknown` input as well as valid input.
- e2e for the user journey when the form is part of one.

### Done checklist

- [ ] Schema messages are codes; every code has copy and the key test covers it.
- [ ] The action takes `unknown`, re-parses, and runs in `runAction` (and a capability for admin actions).
- [ ] The hook returns `useServerForm({ … })` with `values` for every schema key, and translates nothing.
- [ ] The component uses `<form onSubmit={submit}>`, `register` / hook handlers, `useErrorMessage`, `aria-invalid` / `aria-describedby` and `role="alert"`.
- [ ] Schema, hook, component and action tests from the list above.
