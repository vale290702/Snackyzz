# features/checkout

## Purpose
Turns a cart into a placed order: contact details, fulfillment choice, SINPE payment instructions, proof upload, submission and the "order received" page. Orchestration only; owns no tables.

## Owns / does not own
- **Owns:** the checkout form and steps, `placeOrderAction`, rate limiting for checkout, and the success page UI.
- **Does not own:** order persistence or rules (`orders.placeOrder`), delivery windows (`fulfillment`), upload storage (`media`), cart state (`cart`).

## Public API (`index.ts`)
- Server: `getCheckoutContext()` (payment details, fulfillment options, availability), `placeOrderAction`
- Hooks: `useCheckoutForm(context)` (fields, validation, upload, submit, idempotency key)
- UI: `CheckoutForm`, `OrderPlaced`

## Invariants
- A payment proof is **required**; the action rejects requests without a registered `media.files` id of purpose `payment_proof`.
- Checkout is closed (with a clear message) when `orders.settings` has no SINPE phone or recipient.
- The idempotency key is generated once per checkout attempt on the client (`crypto.randomUUID()`), kept across retries, and sent with the request. The fingerprint is computed server-side from the normalized request.
- The chosen delivery window is re-validated with `fulfillment`'s domain function before calling `placeOrder`.
- The client never sends prices, fees or totals. If it does, they're ignored.
- The success page says the payment is **under review** and that an email will follow. It never says "confirmed".
- The cart is cleared only after a successful placement.

## Dependencies
`cart`, `catalog`, `fulfillment`, `inventory` (availability), `orders`, `media`. Pickup only offers Snackyzz **pickup locations**; points of sale (`retail`) never appear in checkout.

## Testing
- Unit: form schema (Spanish error keys), request normalization + fingerprint.
- Integration: replaying the same key returns the same order; same key + different payload → `idempotency_conflict`.
- e2e: full happy path for pickup and for delivery; missing proof blocks submission.

## Gotchas
- Out-of-stock between cart and submit comes back as `out_of_stock` with the variant ids; highlight those lines and don't clear the form.
