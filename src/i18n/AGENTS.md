# src/i18n

## Purpose

All user-facing text and locale formatting, through next-intl. One place to find, review and translate copy.

## Owns / does not own

- **Owns:** `config.ts` (locales, default `es-CR`, time zone `America/Costa_Rica`), `request.ts` (next-intl request config), `messages/<locale>/<namespace>.json`.
- **Does not own:** where copy is used. Components call `useTranslations` / `getTranslations`.

## Structure

```
config.ts          # locales, default locale, time zone
request.ts         # next-intl request config (locale never depends on the request)
messages.ts        # loadMessages(locale) + the Messages type used by app-config.d.ts
messages/es-CR/
  index.ts         # imports every namespace file; add new namespaces here
  common.json      # shared words: buttons, nav, footer
  errors.json      # { "<feature>": { "<error_code>": "…" } }
  catalog.json · cart.json · checkout.json · orders.json · fulfillment.json · retail.json
  inventory.json · messaging.json · notifications.json · admin-chat.json · themes.json · access.json
  marketing.json · reporting.json
```

## Invariants

- One namespace per feature, named exactly like the feature folder.
- Keys are English, `camelCase`, grouped by screen or component: `checkout.payment.uploadHint`.
- Shared boundary errors live under `errors.shared` and match `SharedErrorCode` from `shared/lib/result`.
- Every error code in a feature's `domain/errors.ts` has a message in `errors.json`; a unit test enforces it.
- Use ICU messages for plurals and variables (`{count, plural, one {# galleta} other {# galletas}}`). Never concatenate strings.
- Money: `format.number(n, { style: "currency", currency: "CRC", maximumFractionDigits: 0 })`. Dates: `format.dateTime` with the configured time zone.
- No locale prefix in URLs while there's one locale. Adding a locale = new folder + entry in `config.ts` (+ routing ADR if prefixes are needed).

## Testing

- Unit: all locales have identical key sets; every error code has copy.

## Gotchas

- Email and Telegram templates render on the server outside a request; use `createTranslator` with the messages, not hooks.
- Spanish copy uses "tú" and Costa Rican terms (SINPE Móvil, "retiro", "envío"); follow existing keys.
