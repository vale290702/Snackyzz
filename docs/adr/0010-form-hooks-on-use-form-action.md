# 0010. Build form hooks on a shared `useFormAction`

- **Status:** proposed
- **Date:** 2026-10-25
- **Approver:** Alejandro Loaiza
- **Refs:** [0007](0007-shared-server-core.md), [0009](0009-canonical-code-conventions.md)

## Context

The first form hook (`useSignInForm`) mixed a state type, its initial value, a code set, a translation helper and a submit function with the hook itself. Every later form (checkout, catalog editing, team management) would repeat the same steps: read `FormData`, parse it with the domain schema, turn Zod issues into codes, call the Server Action, keep the codes, restore fields React reset, translate. Server Actions already return `Result` codes (ADR 0007), and copy lives in `errors.json`.

## Decision

- `shared/lib/form-action` owns the generic steps. `FormInput.read` parses the schema's keys out of `FormData` into typed input or per-field codes; `FormInput.values` restores only listed fields; `FormSubmission` turns one submission into the next `FormActionState` (`idle | invalid | failed | succeeded`); `useFormAction(options)` wraps `useActionState` around it. It knows nothing about copy.
- `i18n/use-error-message.hook.ts` owns translation: `useErrorMessage(namespace)` maps a code to `errors.shared` or `errors.<namespace>`, typed so a code without copy fails typecheck.
- Feature hooks bind a schema, an action, field codes and preserved fields by returning `useFormAction({ … })`; they return codes. Components translate with `useErrorMessage`, next to their `useTranslations` labels, so code → copy stays presentation and adding a field adds no mapping in the hook. Forms submit through `<form action>`. The recipe, rules and tests are in `docs/code-conventions.md` ("Forms and Server Actions").

## Alternatives considered

- **React Hook Form (or TanStack Form) with `zodResolver`**: client-controlled state, field-level re-renders and watchers we don't need for short admin and checkout forms; it is built around `onSubmit`, so forms stop working before hydration, and Server Action results still need the same mapping. A new dependency.
- **shadcn `Form`**: a React Hook Form wrapper; same trade-off. The shadcn `Field` primitives we already use cover layout and accessibility.
- **`useActionState` per form**: what sign-in did first; each form re-implements parsing, code mapping and restoring values, and they drift.

## Consequences

New forms are a schema, codes, copy, an action, a one-call hook and a component. Hook tests assert codes without an intl provider; component tests (hook mocked) cover translated, linked errors. Multi-value fields, uploads and nested objects are not supported yet; the first form that needs one extends `FormInput` and the conventions. Client-side parsing is feedback only: actions still parse `unknown` input on the server.
