# 0013. Build data-entry forms on React Hook Form

- **Status:** proposed
- **Date:** 2026-10-26
- **Approver:** Alejandro Loaiza
- **Refs:** supersedes [0010](0010-form-hooks-on-use-form-action.md) for data-entry forms; [0007](0007-shared-server-core.md), [0012](0012-catalog-presentation-editing.md)

## Context

The catalog editor showed where `useFormAction` stops. Text fields were uncontrolled and restored through `preserve`, while selects, checkboxes, colors and images lived in hook state behind hidden inputs. Resetting a form meant remounting it with a `key`, and an unsaved-changes check had to read DOM `change` events. Saved data didn't reach an open form: after a save the editor closed before the refreshed records arrived, so reopening it right away showed the old values, and saving again would write them back. Each fix added custom form machinery we maintain alone. shadcn's form guidance is React Hook Form on the same `Field` primitives we already use.

## Decision

- Forms where people enter data use React Hook Form (`react-hook-form`) with `zodResolver` (`@hookform/resolvers`) and the domain schema. The form owns every value, including selects, checkboxes, arrays and uploaded file ids.
- `@/shared/lib/server-form` has one thin hook, `useServerForm({ schema, values, action, onSuccess, onDirtyChange })`. It wires the resolver, keeps the form in sync with `values` from the server (keeping fields the user changed), sends parsed input to the Server Action, puts a failed `Result` code into the form error, and reports `isDirty`. Field and form errors stay codes; components translate them with `useErrorMessage`.
- Components use `register` for native inputs and `Controller` for Radix controls, inside the shared `Field` primitives. They never import Server Actions.
- Writes that must happen together go to one Server Action. The product editor sends product and first presentation to `saveProductAction`, which runs both capabilities on the server and reports a presentation failure after the product was saved, so a retry updates that product.
- Single-button actions (sign out, archive, set default) have no fields and stay on `useFormAction`'s `<form action>`. Sign-in moves when it is next changed.

## Alternatives considered

- **Extend `useFormAction` with controlled fields, dirty state and reset**: no dependency, but we would rebuild field registration, deep dirty comparison, array fields and value syncing ourselves, and keep maintaining them.
- **TanStack Form**: comparable, but shadcn's guidance and most examples use React Hook Form, and its zod adapter path is less settled.
- **shadcn `Form` wrapper**: superseded upstream by `Field` + `Controller`, which we use directly.

## Consequences

- Feature form hooks become a schema, server values, an action and handlers for real client logic. Hidden inputs, `preserve`, remount keys and DOM dirty tracking go away.
- Two dependencies (~12 kB gzipped). Use `useWatch`, not `watch`, to avoid re-rendering the whole form.
- These forms need JavaScript to submit. Admin forms always have it. Customer forms such as checkout keep submit disabled until hydrated, and never fall back to a native GET submit that would put personal data in the URL.
- `saveProductAction` runs two writes in a row, not a transaction; atomicity needs a SQL entry point (a schema change).
- `useFormAction` remains for single-button actions and sign-in.
