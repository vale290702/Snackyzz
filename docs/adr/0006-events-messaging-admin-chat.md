# 0006. Split notifications into events, messaging, notifications and admin chat, with shared capabilities

- **Status:** accepted
- **Date:** 2026-10-24
- **Approver:** Alejandro Loaiza
- **Refs:** DOM-14, DB-14, DB-15, F-5
- **Supersedes:** [0004](0004-pluggable-notification-channels.md)

## Context

ADR 0004 tied notifications to orders: receipts pointed at `orders.order_events`, templates and conversations had order columns. The Telegram bot must let admins manage orders (MVP: receive → Confirm/Reject), send summaries (step 2) and later host an AI agent (step 3).

## Decision

- `events`: app-wide `domain_events` written by entry points in the same transaction (`private.publish_event`); consumers record `event_receipts`.
- `messaging`: transport only, with channel identities (two-step linking), an outbound queue with already-rendered content and loose subject references for edits, an inbound inbox deduplicated by provider id, and one adapter per channel.
- `notifications`: notification types, per-admin subscriptions with brand filters, pause; rules turn events into rendered messages.
- `admin-chat`: conversation flows as pure state machines with JSON state validated per flow; a command log.
- **Capabilities**: admin actions defined once per feature (permission + Zod input + execute). Web Server Actions, bot flows and future agent tools all call them.

## Alternatives considered

- **Keep 0004 and add columns** — every new event source, flow or summary becomes a schema change.
- **Bot calls repositories directly** — duplicates permission and validation logic between web and bot.
- **Agent with direct SQL access** — permissions would depend on prompts, not code.

## Consequences

Four small features instead of one. New channels, event sources, bot commands and agent tools are additive. Alerts and emails are eventually consistent (seconds via `after()`, ≤ 1 min via cron).
