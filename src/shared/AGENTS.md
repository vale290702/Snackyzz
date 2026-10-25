# src/shared

## Purpose

Domain-agnostic building blocks used by many features: UI primitives, small utilities and validated configuration. Nothing here knows what a cookie, order or brand is.

## Owns / does not own

- **Owns:** `ui/` (shadcn/ui components restyled with tokens), `lib/` (result, logger, run-action, money/date formatting helpers, ids, assertions), `config/` (env parsing).
- **Does not own:** anything with business meaning. If a helper mentions a glossary term, it belongs in a feature.

## Public API

- `@/shared/ui/<component>` (shadcn/ui, restyled; preview them all at `/ui` in `next dev`):
  - `button`: `Button`, `buttonVariants` (`default` · `dark` · `outline` · `destructive` · `ghost` · `link`)
  - `input`: `Input` · `textarea`: `Textarea` · `label`: `Label`
  - `field`: `Field`, `FieldLabel`, `FieldDescription`, `FieldError`, `FieldGroup`, `FieldSet`, `FieldLegend`, `FieldContent`, `FieldTitle`, `FieldSeparator`
  - `select`: `Select`, `SelectTrigger`, `SelectValue`, `SelectContent`, `SelectItem`, `SelectGroup`, `SelectLabel`, `SelectSeparator`
  - `checkbox`: `Checkbox` · `radio-group`: `RadioGroup`, `RadioGroupItem`
  - `dialog`: `Dialog`, `DialogTrigger`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogDescription`, `DialogFooter`, `DialogClose`
  - `sheet`: `Sheet`, `SheetTrigger`, `SheetContent` (`side`), `SheetHeader`, `SheetTitle`, `SheetDescription`, `SheetFooter`, `SheetClose`
  - `table`: `Table`, `TableHeader`, `TableBody`, `TableFooter`, `TableRow`, `TableHead`, `TableCell`, `TableCaption`
  - `badge`: `Badge`, `badgeVariants` (`neutral` · `brand` · `selected` · `outline` · status tones `pending` · `positive` · `negative`)
  - `card`: `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`
  - `sonner` (Toast): `Toaster` (mount once per layout, `containerAriaLabel` required), `toast()`
  - `separator`: `Separator`
- `@/shared/lib/cn`: `cn(...classes)` (clsx + tailwind-merge taught the brand radius, shadow and text tokens; used by `ui/`)
- `@/shared/config/runtime`: `isProduction()`
- `@/shared/lib/result`: `Results.ok/err/isOk`, `SharedError`, `Result`, `SharedErrorCode`; original `ok/err/isOk` aliases remain available
- `@/shared/lib/logger`: `logger`, `createLogger(context)`, `Mask.email()`, `Mask.phone()` (`mask` remains an alias), `Logger`, `LogData` (flat diagnostic fields); loggers expose `info`, `error`, `step`
- `@/shared/lib/run-action`: `runAction(name, operation)`, `ActionResult`
- `@/shared/lib/capability`: `defineCapability({ name, kind, permission, input, execute })` → `{ run(context, input) }` (checks permission, parses input, then executes), `CapabilityContext<Client, Permission, Admin>`, `CapabilityDefinition`, `Capability`, `CapabilityKind`, `CapabilitySource`
- `logger` also exports `LogSanitizer.text/fields`, `LogLevel`, `LogLevelValue`; `run-action` also exports `ErrorDiagnostics.toLogData/stackFrames`, `ActionEvent/Outcome`, `ActionOperation`, `ActionOutcomeValue`.
- `lib/` groups code by purpose: `logger/`, `result/`, `run-action/`, `capability/`, `cn/`. Each group exposes explicit public exports from `index.ts`; import the group path, not another group's implementation files.
- Implementations use role suffixes (`*.helper.ts`, `*.factory.ts`, `*.runner.ts`); supporting files use `*.types.ts`, `*.constants.ts` and `*.schema.ts`. Tests sit beside their implementation with matching names. Documentation uses multiline JSDoc blocks.
- `@/shared/config/env.server` (`serverEnv`), `@/shared/config/env.public` (`publicEnv`), `@/shared/config/parse-env` (`parseEnv`). Each feature adds the variables it needs to these schemas and to `.env.example`.

## Invariants

- `shared` never imports from `features`, `app` or `integrations` (ESLint boundary).
- `config/env.server.ts` starts with `import "server-only"`; it's the **only** module that reads secret `process.env` values. `env.public.ts` reads only `NEXT_PUBLIC_*`.
- Env is parsed with Zod at import time; a missing variable fails fast with its name, never its value.
- `ui/` components are added with the shadcn CLI, then restyled with tokens. Track local changes in a comment at the top of the file so they survive regeneration.
- No user-facing strings in `ui/`; components take labels as props or children. `DialogContent` and `SheetContent` render their close button only when given `closeLabel`.
- Only toasts cast a shadow (`shadow-float`). Cards, dialogs, sheets and listboxes stay flat.
- Badges carry tones, not domain states: each feature maps its own states to `pending` / `positive` / `negative` / `neutral`.

- Logger, action and capability modules are server-only. Pass only explicitly selected safe fields to logs; never raw payloads or secrets. Redaction is defense in depth, not permission to log sensitive input.
- `Mask.email` validates whole values with Zod and fully hides invalid addresses. Embedded log-text scans use named patterns in `logger/log-sanitizer.constants.ts`; sensitive-value key suffixes are redacted regardless of value validity. Phone masking only applies to string/number values in `phone` keys or camel/snake-case `Phone` suffixes; free-text digits are preserved, so callers must supply phones as named fields or mask them explicitly.
- `runAction` returns expected Results unchanged, catches bugs as `unexpected`, and rethrows Next signals through `unstable_rethrow`. Unexpected diagnostics include stack frames, bounded error names and SQLSTATE codes, never messages/payloads. A small Zod schema validates diagnostic identifiers; absent or invalid SQLSTATE is `null`. Finish logs include failure codes and integer-millisecond duration, including on framework interrupts.
- Capability context comes from trusted server code. `access` fills `permissions: ReadonlySet<Permission>` from SQL; no permission matrix lives here. Annotate `execute`'s context with the application's concrete context type.
- Capabilities check permission before async Zod parsing, pass parsed output to `execute`, and let bugs propagate. `kind` is `query | mutation`; `source` is `admin_web | messaging`.
- Capability `invalid_input` intentionally omits Zod issues. Feature forms should reuse client-safe domain input schemas for field feedback; the server independently validates every capability call. Server-only validation failures remain generic unless a feature defines a safe error contract.
- Shared error copy lives at `errors.shared.<code>`; feature errors stay in feature namespaces.

## Testing

Unit tests for every `lib/` module. Component tests for primitives with behavior (keyboard, focus trap).

## Gotchas

- Don't add a helper here "because two features might need it". Wait for the third use (AG-02).
- Money formatting needs the locale; take a formatter from next-intl, don't hard-code `es-CR`.
- The shadcn CLI writes `import { cn } from "cn"` with this `components.json`. Fix it to `@/shared/lib/cn` after every `shadcn add`, then run `eslint --fix` and Prettier (it also emits `import * as React` and no semicolons).
- The sonner component pulls in `next-themes` on `add`; uninstall it, there is no dark mode.
- Radix primitives in jsdom need the pointer-capture, `scrollIntoView` and `ResizeObserver` stubs in `vitest.setup.ts`.
- When you add a token scale (radius, shadow, text size) to `tokens.css`, add its names to `extendTailwindMerge` in `lib/cn/cn.helper.ts`, or `cn()` won't resolve overrides.
