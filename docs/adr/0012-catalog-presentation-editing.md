# ADR 0012: Catalog presentation editing and modal editors

- Status: proposed
- Approver: Alejandro Loaiza
- Date: 2026-10-25

## Context

The catalog separates products from purchasable presentations. Creating only a product leaves it absent from the storefront, while the owner sees a successful save. The existing phone editor follows the entire list and loses the owner's location. Optional fields dominate the product form before a price can be entered.

## Decision

The owner approved inline single-presentation editing and one-step creation including its first price. Additional presentations reveal the existing presentation list. Existing capabilities retain all validation, authorization, default-presentation and price-history behavior. Separate writes are not represented as a transaction; partial failures retain record ids for repair/retry.

Use the existing Radix/shadcn Sheet for modal editing: right side on desktop, full height on phones, preserved background scroll and focus restoration. Protect unsaved close/navigation, retain failed submissions, and confirm complete saves with a toast. No editor route or deep-link contract is added.

Storefront cards with multiple presentations show the actual minimum price, presentation count and an explicit choice action. The phone detail becomes a bottom sheet with a persistent purchase footer; desktop retains two columns and the purchase provider seam.

## Alternatives

- Always show presentation management: simpler model but unnecessary work for the common single presentation.
- Product/presentation wizard: explicit steps but slower maintenance.
- Desktop side panel and phone sheet: two focus and navigation patterns and limited editing width.
- Dedicated editor route: useful deep links/history, larger routing investment for this small catalog.
- Card-level presentation pickers: enlarge the shelf and reduce product scanability.

## Consequences

No schema, stock, pricing, permissions or new dependencies. Owners manage sellable products with fewer steps, but composed writes require explicit partial-failure recovery. Modal editors prevent simultaneous background list interaction; returning focus and unchanged filters preserve continuity. Optional categories remain admin metadata under Más opciones while the storefront groups by brand.
