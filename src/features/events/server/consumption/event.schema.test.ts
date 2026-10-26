import { describe, expect, it } from "vitest";

import { domainEventSchema } from "./event.schema";

const event = {
  id: "00000000-0000-7000-8000-000000000001",
  type: "order.placed",
  version: 1,
  aggregate_type: "order",
  aggregate_id: "00000000-0000-7000-8000-000000000002",
  payload: { number: "SN-1" },
  actor_type: "system",
  actor_admin_id: null,
  occurred_at: "2026-10-25T12:00:00Z",
};

describe("domain event boundary", () => {
  it("parses the database envelope without exposing database field names", () => {
    expect(domainEventSchema.parse(event)).toEqual({
      id: event.id,
      type: event.type,
      version: 1,
      aggregateType: "order",
      aggregateId: event.aggregate_id,
      payload: event.payload,
      actorType: "system",
      actorAdminId: null,
      occurredAt: event.occurred_at,
    });
  });

  it.each(["order", "Order.placed", "order.placed.extra", "order.placed1"])(
    "rejects malformed type %s",
    (type) => {
      expect(domainEventSchema.safeParse({ ...event, type }).success).toBe(false);
    },
  );

  it.each([
    { payload: undefined },
    { version: 0 },
    { version: 1.5 },
    { actor_type: "visitor" },
    { aggregate_id: "invalid" },
    { occurred_at: "yesterday" },
  ])("rejects invalid envelope fields %j", (fields) => {
    expect(domainEventSchema.safeParse({ ...event, ...fields }).success).toBe(false);
  });
});
