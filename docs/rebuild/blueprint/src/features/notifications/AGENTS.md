# features/notifications

## Purpose
Decides **what to tell whom, and when**: reacts to domain events, picks recipients from subscriptions, renders the message for each channel, and hands it to `messaging`. Also lets each admin manage their own subscriptions.

## Owns / does not own
- **Owns:** schema `notifications` (notification_types, subscriptions, subscription_brands, admin_notification_settings), event → message rules, templates (one renderer per channel), the `notifications` event consumer, and the admin "Notificaciones" settings UI.
- **Does not own:** sending, retries, linked accounts or webhooks (`messaging`); button taps and chat flows (`admin-chat`); the events themselves (published by their owners).

## Public API (`index.ts`)
- Server: `notificationsConsumer` (passed to `events.runEventConsumers` by the jobs route), `updateSubscriptionAction`, `pauseNotificationsAction`
- Hooks: `useNotificationSettings(settings)`
- UI: `NotificationSettings`

## Structure
```
domain/rules/<event-type>.ts   pure: event payload + recipients → OutboundMessage drafts
domain/templates/<type>.ts     one renderer per channel (telegram: text + buttons; email: subject/html/text)
domain/recipients.ts           pure: subscriptions + pause + brand filter + permission → recipients
server/consumer.ts             pending events → rules → messaging.enqueue → receipt
```

## Invariants
- MVP notification types: `order.placed.admin` (alert with Confirmar / Rechazar / Ver en panel buttons), `order.decided.admin` (edits every earlier alert for that order), `order.confirmed.customer`, `order.rejected.customer`, `order.cancelled.customer`.
- Rules are **pure** and read only the event payload (event-carried state). Never query another feature's tables.
- Admin recipients must be subscribed, not paused, match the brand filter, and have the permission the buttons need (`orders.decide`).
- Each message's dedupe key is `<event_id>:<notification_type>:<identity_id or address>`, so re-running the consumer is safe.
- On `channel_identity.linked`, the consumer creates that admin's default subscriptions for the channel.
- Customer notifications are not configurable and go to the contact email in the payload.
- Button callback data is built by `admin-chat`'s `buildCallback()`; never hand-format it here.

## Dependencies
`events`, `messaging`, `orders` (event payload types only), `admin-chat` (`buildCallback` only), `access`, `catalog` (brand names).

## Testing
- Unit (TDD): every rule × payload, recipient filtering (paused, brand filter, missing permission), every template renders for every channel it supports.
- Integration: consumer is idempotent (run twice → same messages, one receipt).

## Gotchas
- Telegram text uses HTML parse mode; escape customer-provided text (names, addresses).
- Templates use `createTranslator` (no request context in jobs).
