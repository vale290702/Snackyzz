# 0004. Channel-agnostic notifications with pluggable adapters and an event-driven outbox

- **Status:** superseded by [0006](0006-events-messaging-admin-chat.md)
- **Date:** 2026-10-24
- **Approver:** Alejandro Loaiza
- **Refs:** DOM-14, DB-14, DB-15

## Context

Email and Telegram had separate outbox tables and code paths. WhatsApp or SMS would add a third. The Telegram integration was WIP.

## Decision

- Orders append domain events (`orders.order_events`); notifications reads them (orders never imports notifications).
- Pure fan-out rules turn events into rows in one outbox (`notifications.messages`) with dedupe keys.
- A dispatcher sends through a `NotificationChannel` interface (Strategy) resolved from a registry; each template has one renderer per channel.
- Inbound messaging uses an `InboundChannel` interface producing channel-agnostic commands; multi-step admin actions are a pure conversation state machine.
- Generic tables: `contact_points`, `link_tokens`, `messages`, `event_receipts`, `inbound_events`, `conversations`.

## Alternatives considered

- **Class hierarchy (`BaseNotifier` subclasses)** — inheritance couples channels; an interface + composition is enough.
- **Enqueue inside order RPCs** — atomic, but couples orders to notification rules.

## Consequences

A new channel = enum value + adapter + renderers. Notifications are eventually consistent (seconds via `after()` kick, ≤ 1 min via cron). Delivery uncertainty is surfaced as `unknown` instead of re-sending.
