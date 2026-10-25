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
- No user-facing strings in `ui/`; components take labels as props or children. `DialogContent` and `SheetContent` render their close button only when given `closeLabel`.
- Only toasts cast a shadow (`shadow-float`). Cards, dialogs, sheets and listboxes stay flat.
- Badges carry tones, not domain states: each feature maps its own states to `pending` / `positive` / `negative` / `neutral`.

## Testing

Unit tests for every `lib/` module. Component tests for primitives with behavior (keyboard, focus trap).

## Gotchas

- Don't add a helper here "because two features might need it". Wait for the third use (AG-02).
- Money formatting needs the locale; take a formatter from next-intl, don't hard-code `es-CR`.
- The shadcn CLI writes `import { cn } from "cn"` with this `components.json`. Fix it to `@/shared/lib/cn` after every `shadcn add`, then run `eslint --fix` and Prettier (it also emits `import * as React` and no semicolons).
- The sonner component pulls in `next-themes` on `add`; uninstall it, there is no dark mode.
- Radix primitives in jsdom need the pointer-capture, `scrollIntoView` and `ResizeObserver` stubs in `vitest.setup.ts`.
- When you add a token scale (radius, shadow, text size) to `tokens.css`, add its names to `extendTailwindMerge` in `lib/cn.ts`, or `cn()` won't resolve overrides.
