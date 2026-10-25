# features/admin-chat

## Purpose
The admin panel over chat (the Telegram admin bot). MVP: confirm or reject an order from its alert. Step 2: summaries and commands (`/pendientes`, `/resumen`). Step 3 (post-MVP): an AI agent that answers admin questions using capabilities as tools.

## Owns / does not own
- **Owns:** schema `admin_chat` (conversations, command_log), flow state machines, command routing, callback data format, chat replies.
- **Does not own:** business rules (feature capabilities), transport (`messaging`), alerts sent because of events (`notifications`).

## Public API (`index.ts`)
- Server: `adminChatInboundHandler` (passed to `messaging.handleWebhook` by the webhook route), `buildCallback(flow, decision, subjectId, linkVersion)` (used by notification templates)

## Structure
```
domain/flows/order-decision.ts   pure state machine: choosing → awaiting_comment | awaiting_reason → awaiting_refund_proof → reviewing
domain/flows/registry.ts         flow name → { stateSchema, transition(state, command) → { state, effects } }
domain/callback.ts               build/parse "<link_version>:<flow>:<decision>:<id>" (≤ 64 bytes)
server/router.ts                 InboundCommand → active conversation or new flow
server/effects.ts                runs effects: reply, call capability, store file via media, end flow
server/capability-registry.ts    collects capabilities from feature index.ts files
```

## Invariants
- Flows are **pure**: `(state, command) → { nextState, effects[] }`. All I/O happens in `server/effects.ts`. That makes every flow unit-testable without Telegram.
- Every business action is a **capability** call with `source: "messaging"`. The admin is resolved from the sender's channel identity, and the capability re-checks the permission. Callback data is never trusted alone.
- One active conversation per identity; it expires after 15 min; `version` guards against concurrent updates.
- Nothing changes before the final confirmation tap, and the review step shows exactly what the customer will receive.
- Refund proofs from chat are downloaded, validated and stored through `media`. Never keep Telegram file references.
- Every capability call is written to `command_log` (`succeeded` | `failed` | `denied`).
- Step 3: the agent may only use capabilities as tools, acts as the linked admin, starts read-only, and needs a confirm tap for any mutation. No direct DB or SQL access.

## Dependencies
`messaging`, `orders` (capabilities, types), `media`, `access`.

## Testing
- Unit (TDD): every flow transition, timeouts, cancel, callback build/parse, oversized callback rejected.
- Integration: confirm and reject end to end with a fake Telegram adapter; two admins racing; stale button after the order was decided; archived admin denied.
- e2e: covered by `tests/e2e/telegram-bot.spec.ts` with the fake adapter.

## Gotchas
- Answer every `callback_query` (even with an empty notice), or Telegram shows a spinner on the button.
- Escape user-typed text before echoing it back in HTML parse mode.
