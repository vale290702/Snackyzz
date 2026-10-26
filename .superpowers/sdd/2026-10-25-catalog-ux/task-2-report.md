# Task 2 — Sellable creation and friendly catalog fields

## Delivered

- ProductForm accepts optional `variants: readonly Variant[]`; parent passes the product's variants. Zero or one active presentation is edited inline with presentation name (translated default Unidad), positive whole-colon price, optional SKU and stock tracking. Multiple active presentations leave presentation management to VariantsSection.
- `useProductForm` composes `useProductSubmission`, which uses the existing useFormAction recipe and product/create-update + variant/create-update actions. No new server API or capability, no schema/dependency/auth/money/stock changes.
- After product success and presentation failure, the created product id remains in a ref and is exposed as `partialProductId`. The form shows explicit partial-save copy and never calls `onSaved` on that failure. Retry updates the retained product, then retries the presentation. The separate writes are not claimed to be atomic.
- A sole existing presentation is updated alongside the product. Existing sort order is preserved. Existing products lacking an active default show an explicit storefront-visibility warning.
- Product, brand and category names generate slugs for new records; existing slugs stay stable. Explicit Editar enlace enables manual editing. Controlled values survive failed submissions.
- Product colors offer existing Snackyzz palette swatches, a custom native picker and typed hex input. Invalid/incomplete typed hex remains visible for correction.
- Optional categories live under Más opciones, with search and checkbox multiselection. Selected ids submit independently of filtered choices, so search cannot remove selections. Copy explains storefront grouping remains by brand.
- Product, brand, category and variant numeric position controls are replaced by hidden preserved sortOrder values.
- Forms expose aria-busy (including product/brand upload state). ProductForm has id `catalog-product-form` for the parent editor's guard snapshot.

## Verification

- Red-first schema/hook run demonstrated missing creation orchestration: onSaved fired before presentation success and no sole-presentation update occurred. Implemented behavior then passed.
- Focused domain/hooks/components: 11 files, 34 tests passed (Vitest), including initial-price validation, complete create, partial failure/retry, sole inline update, expansion to multiple presentations, slug behavior, palette/custom hex, searched category selection preservation, inline rendering/accessibility and hidden ordering.
- Database integration: products.actions.int.test.ts, 7 tests passed. Added capability-composition coverage that creates a product, rejects an invalid initial presentation, updates the same product id and successfully creates its default presentation.
- Owned-file ESLint clean. TypeScript `tsc --noEmit` clean after parent editor file changes settled.
- Parent requested deferring full unit/check runs until its concurrent editor tests settle. Parent owns combined check/e2e and 390/1440 screenshot verification.

## Integration / ownership notes

Parent owns catalog editor, manager state, variant-management expansion guard, row ordering, skeletons and e2e. No parent editor files were edited by this task. Parent wires variants and prevents starting second-presentation management until pending product edits are saved. Shared catalog.json includes parent's editor keys with explicit parent approval for committing that file together.

## Visible deviations from previous UI

Single-step sellable creation and inline single-presentation editing; explicit link editing; palette/custom hex controls; optional searched categories in Más opciones; hidden numeric order controls; partial-save and not-visible messaging. Existing design tokens and shared form primitives are retained.
