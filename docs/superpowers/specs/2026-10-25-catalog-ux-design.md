# Catalog UX improvements

Approved by the owner in chat on 2026-10-25: recommended directions A for storefront presentation signals, inline single-presentation editing and modal editor sheets.

## Experience

Preserve DESIGN.md and G-09. Multi-presentation cards show the minimum active presentation price with “Desde”, a count, and “Elegir presentación”; single-presentation cards keep direct add. Choice happens in details. Phones use a bottom sheet with stacked radio cards and sticky selected price/purchase action. Desktop keeps the existing two-column dialog. ProductPurchaseProvider remains the purchase seam.

The owner creates a sellable product in one submission including the first presentation's name (Unidad by default), price, optional SKU and stock-tracking toggle. One presentation is edited inline; adding a second reveals presentation management without replacing the first. Existing products lacking a default show an explicit not-visible warning. Compose existing capabilities; keep a created product id after partial failure so retry never duplicates it. Never claim atomicity across separate writes.

Admin editors use a generous right sheet on desktop and full-height sheet on phones over the unchanged list. Preserve scroll/filter state and return focus to the originating control. Guard dirty close, Escape, outside click, record/view switching and browser unload. Save confirms with a toast. No dedicated editor routes or deep links in this pass.

## Supporting improvements

- Start status filter at Activos.
- Generate slug from name under CatalogFields rules; existing slugs remain stable; edit only on explicit request.
- Brand palette swatches plus custom picker and typed hex string.
- Replace numeric position fields with accessible up/down ordering through existing update actions. Include brands, categories, products and presentations where position is currently editable; do not add bulk capability.
- Optional categories stay under Más opciones with search and multi-selection. Storefront continues grouping by brand.
- Add shaped Suspense skeletons for /shop, /brands/[slug] and /admin/catalog.

## Constraints and proof

No schema, money/stock rule, auth/permission or dependency changes. Never reset/start/stop shared Supabase. No cart/header work, sold-out states, archive restoration, image drag/progress or additional brand filters. One hook per interactive component; components render; useFormAction forms; next-intl Spanish; shared primitives and Tailwind tokens.

Tests: domain first, renderHook for hooks, rendering/accessibility for components, server integration for orchestration and desktop/mobile catalog e2e. Run npm run check and relevant e2e. Capture before/after at 390 and 1440 on port 5183, document deviations and update catalog AGENTS.md and PR31. Initial captures were blocked by shared DB DNS error PGRST000; retry without changing stack lifecycle.
