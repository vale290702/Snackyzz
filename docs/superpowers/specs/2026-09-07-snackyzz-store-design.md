# Snackyzz store and order management

Product authority: `PRODUCT.md`, supplemented by the user's approval to create the design, use best engineering practices, and support responsive web.

## Architecture

Keep the existing modular vanilla JavaScript frontend; add a Python Flask API, SQLite persistence, private image storage, password-protected admin sessions and configurable SMTP email. This makes the requested complete workflow runnable locally with one application server. Production hosting must supply a persistent disk, HTTPS, administrator credentials, SMTP and genuine catalog/payment configuration. Never present a local-only simulation as a delivered email or real payment verification.

## Experience

Spanish storefront with three sample flavors until real catalog information is supplied. Cream and chocolate, bold orange calls to action, rounded editorial serif headings, generous product photography, compact legible sans-serif controls. Home leads with “Un antojo. Tres formas de caer.” and a direct shopping action. The shop combines product selection and a visible cart. Product detail uses a keyboard-accessible native dialog. Checkout has customer name, email, optional phone, order summary, required receipt image and explicit SINPE review explanation. Success displays only after the API persists the order. Sales Points lists honest empty content until actual locations are configured. Admin presents pending/confirmed orders, search, receipt view, confirmation and email status/retry.

## Visual direction contract

Incomplete incumbent brand, expanded under the user's delegation. Grounded directions considered: neighborhood bakery menu, printed cookie bag, recipe editorial, confectionery campaign, café counter, food magazine, gift-box label. Build the fourth direction: a confectionery campaign, combining oversized rounded serif copy, orange studio cookie photography and a cream shopping canvas. The seed ran without external challengers after an escalated retry; no external quality boards were supplied. Product detail repeats campaign imagery; checkout/admin turn down display scale while preserving typography and palette. No UI comps: the user chose code-first.

FIRST VIEWPORT: cream masthead with chocolate wordmark, light navigation and dark cart control; generous two-column hero with a large stacked headline and a large orange cookie photograph with an overlapping cream circular brand seal. The next product section begins at the fold. Mobile stacks copy above photograph without horizontal overflow; no essential control is hidden.

Signature interaction: adding a cookie updates the cart count and total immediately, with a brief bag nudge and live announcement. Motion uses a short image reveal and subtle control displacement, disabled by reduced-motion preference. Use authored or generated illustrative photography, labeled as reference imagery until replaced by real product photographs.

## API contract

- `GET /api/catalog` → `{products, salesPoints, payment:{number,recipient,configured}, demoCatalog}`. Products use `{id,name,price,description,tag,image,accent}`; prices in CRC integer colones for this initial Costa Rica SINPE implementation (explicit demo pricing).
- `POST /api/orders` multipart fields `name`, `email`, `phone` (optional), `items` JSON array of `{productId,quantity}`, `receipt` File; header `Idempotency-Key`. Return `201 {order:{id,status,total,createdAt}}` only after persistence. The server validates image content, bounded file size, valid quantities and identifiers and computes authoritative totals. Repeated identical requests return the same order.
- `GET /api/admin/session` → `{authenticated,csrfToken?}`.
- `POST /api/admin/login` JSON `{password}` → `{authenticated:true,csrfToken}`. Set HttpOnly SameSite cookie. Require CSRF token in `X-CSRF-Token` for authenticated mutations; session expiry and login rate limit.
- `POST /api/admin/logout` → `{ok:true}`.
- `GET /api/admin/orders` → `{orders}` with `{id,name,email,phone,items,total,status,createdAt,confirmedAt,emailStatus,receiptUrl}`.
- `POST /api/admin/orders/:id/confirm` → `{order}`. Confirm once; send email with idempotent/outbox semantics. SMTP failures remain visible and retryable rather than claiming success.
- `POST /api/admin/orders/:id/retry-email` → `{order}`.
- `GET /api/admin/orders/:id/receipt` serves validated image only to authenticated administrators.

No external email is sent during development tests; SMTP uses an injected test transport. No credentials are committed. Public static serving must allowlist only public frontend files.

## Verification

Python integration tests cover required/invalid receipt, server totals, duplicate submission, persistence, auth and CSRF, confirmation/email success and failure, protected uploads and private paths. JavaScript tests cover malformed stored cart state, integer quantities, unknown products, price totals and escaping. Browser checks cover desktop/mobile, keyboard modal behavior, cart/checkout validation and an end-to-end order/admin flow. Old copy/style assertion tests will be replaced where they enshrine superseded requirements.
