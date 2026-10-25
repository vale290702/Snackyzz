# features/messaging

## Purpose

The transport layer for every channel (Telegram, email; WhatsApp/SMS later): linking admins' chat accounts, sending and editing messages with retries, and receiving webhooks. It has **no business knowledge**.

## Owns / does not own

- **Owns:** schema `messaging` (channel_identities, link_tokens, outbound_messages, inbound_updates), channel adapters, the outbound dispatcher, the webhook handler for `/api/webhooks/[channel]`, and the "Vincular Telegram" UI.
- **Does not own:** deciding what to send (`notifications`), what a button tap means (`admin-chat`), or vendor HTTP details (`src/integrations/{telegram,resend}`).

## Public API (`index.ts`)

- Types: `ChannelKind`, `OutboundMessage`, `InboundCommand`, `ChannelIdentity`
- Server: `enqueueOutbound(messages)`, `listOutboundBySubject(subjectType, subjectId)`, `runOutboundDispatcher()`, `handleWebhook(channel, request, inboundHandler)` (the webhook route passes `admin-chat`'s handler, so messaging never imports it), `resolveIdentity(channel, externalUserId)`, `createLinkTokenAction(channel)`, `approveLinkAction`, `unlinkIdentityAction`
- Hooks: `useTelegramLink()`
- UI: `TelegramLinkCard`

## Structure

```
domain/channel-adapter.ts   ChannelAdapter<K> interface (Strategy), DeliveryError (retryable | permanent)
domain/inbound-command.ts   channel-agnostic union: button_tapped, text_received, photo_received, start_with_token, command
domain/retry.ts             backoff 1m, 5m, 30m, 2h, max 5
server/adapters/telegram.ts server/adapters/email.ts
server/registry.ts          ChannelKind → adapter
server/dispatcher.ts        claim → deliver → complete
server/webhook.ts           verify secret → claim_inbound (dedupe) → parse → resolve identity → injected inbound handler
```

## Invariants

- Content arrives **already rendered**. Messaging never builds message text.
- Linking takes two steps: deep link with a one-time token (10 min), then approval on the web. Approval publishes `channel_identity.linked` (notifications creates default subscriptions from it). Re-linking or unlinking bumps `link_version`.
- Webhooks: verify the channel secret first (401 otherwise); dedupe by provider update id; return 200 after a successful claim, even when processing fails (failures are recorded, not retried by the provider).
- Messages from unknown senders are `ignored` (one "cuenta no vinculada" reply at most).
- A message stuck in `sending` for 10 min becomes `unknown` and is not resent automatically.
- Adding a channel = enum value + adapter. If the dispatcher has to change, the abstraction is wrong; stop and ask.

## Dependencies

`access`, `src/integrations/{telegram,resend}`.

## Testing

- Unit: retry schedule, Telegram update → `InboundCommand` parsing (fixtures of real payloads).
- Integration: dispatcher with a fake adapter (claim/complete, retry, `unknown`); linking happy path and token expiry; webhook bad secret → 401, duplicate update → no-op.

## Gotchas

- Telegram ids exceed 2^31; keep them as text.
- Mask addresses and chat ids in logs.
