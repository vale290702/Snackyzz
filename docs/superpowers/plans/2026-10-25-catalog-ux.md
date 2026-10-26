# Catalog UX Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Make presentation selection explicit and catalog editing safe and sellable in one step.

**Architecture:** Keep existing capability and purchase seams. Separate storefront detail/presentation work from admin forms, then integrate modal editor safety and ordering. No database changes.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind, Radix/shadcn, next-intl, Supabase, Vitest, Playwright.

**Spec:** docs/superpowers/specs/2026-10-25-catalog-ux-design.md

## Global Constraints

No schema, money/stock rule, auth/permission or dependency changes. Never reset/start/stop shared Supabase. Components render, one hook per interactive component, useFormAction forms. Spanish through next-intl. Preserve G-09 and existing purchase seam. No cart/header work. Verify 390px and 1440px.

### Task 1: Storefront choice and responsive detail

**Files:** catalog domain/variants, hooks/storefront, ui/storefront; catalog.json product namespace; tests/e2e/catalog.spec.ts shopper tests.

**Interfaces:** Consumes ProductDto and ProductPurchaseProvider. Produces cards that choose on multiple presentations, responsive bottom detail and unchanged public purchase API.

- [x] Add failing domain/hook tests: multi-presentation minimum differs from default; choose opens details and does not purchase default; single direct add unchanged.
- [x] Run focused Vitest command and confirm meaningful red.
- [x] Implement presentation summary helper, hook state and labelled card action. Use minimum of active DTO variants; no mutation/pricing rule changes.
- [x] Adapt existing Radix dialog to bottom-sheet layout on phones with a single mounted detail tree and sticky purchase footer; desktop existing layout. Use shared primitive composition; no new dependency.
- [x] Add rendering/accessibility tests and update shopper e2e, including Escape/return focus and radio keyboard choice. Run focused tests and commit Conventional Commit.

### Task 2: Sellable creation and friendly admin fields

**Files:** catalog domain/products, server/products, hooks/manager/use-product-form*, ui/manager/product-form*, product-placement-fields*, reusable catalog field components/hooks; brand/category/variant forms where numeric sort and slug occur; catalog/errors messages.

**Interfaces:** ProductForm additionally receives existing variants and calls onSaved only after complete success. Reuse create/update product and variant capabilities, no public API changes used by other features. Expose a saved/partial state to keep retry tied to created product.

- [x] Add failing schema and renderHook tests for initial price validation, complete creation, first-presentation failure/retry with retained product id, inline single edit, and expanding to multiple presentations.
- [x] Confirm tests fail, implement orchestration using existing capability rules and useFormAction. Add integration coverage for server work.
- [x] Implement generated slug with explicit edit, brand swatches/custom hex, searchable category multi-select under Más opciones. Keep controlled values on failure and existing image upload safeguards.
- [x] Replace position inputs with hidden preserved sortOrder; Task 3 supplies visible row ordering. Add component accessibility tests, run focused checks and commit.

### Task 3: Safe sheets, ordering, skeletons and verification

**Files:** catalog manager hook/editor/panel/row files, domain/manager ordering helper, three catalog route pages, catalog public exports for skeletons, tests/e2e/catalog.spec.ts, catalog AGENTS.md, ADR and PR body.

**Interfaces:** Consume Task 2 ProductForm variants prop and complete success callback. Existing update actions persist sortOrder. Existing Sheet, Dialog and sonner supply UI; no dependencies.

- [x] Add failing manager/renderHook tests for active default, dirty close/switch cancellation, clean close, successful save, reorder and failure preservation.
- [x] Implement full-height mobile/right desktop sheet, shared dirty state and accessible discard confirmation, unload guard, pending-upload/save safeguards, focus restoration. Delete obsolete useEditorPanel.
- [x] Add labelled up/down actions for existing ordered records, deterministic ordering for ties, and error/success announcements. Test action failures.
- [x] Add real-list-shaped skeletons to all three Suspense boundaries with accessible loading text and reduced-motion support. Component tests cover skeleton rendering.
- [x] Extend desktop/mobile e2e for one-step creation, multiple presentations, dirty guard, reorder, categories, palette/custom hex and responsive product purchase footer.
- [x] Run npm run check, integration tests and catalog e2e. Fix failures, capture real screens at 390/1440 on 5183, review whole branch. Update AGENTS.md, ADR, PR deviations and screenshot evidence; commit and push PR31.
