import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { z } from "zod";

import { createAnonClient } from "@/integrations/supabase/anon-client";
import { createServiceClient } from "@/integrations/supabase/service-client";
import { Results } from "@/shared/lib/result";

import { consumptionRepository } from "./consumption.repository";
import { runEventConsumers } from "./consumption.runner";
import type { EventConsumer } from "./consumption.types";
import { EventFixtures } from "../testing/events-fixtures.helper";

const service = createServiceClient();
const repository = consumptionRepository(service);
let eventId: string;

beforeAll(() => {
  eventId = EventFixtures.publish();
});
afterEach(() => vi.restoreAllMocks());

async function receipt(consumer: string) {
  const { data, error } = await service
    .schema("events")
    .from("event_receipts")
    .select("status,attempts,last_error,processed_at")
    .eq("consumer", consumer)
    .eq("event_id", eventId)
    .single();
  expect(error).toBeNull();
  return data;
}

describe("event consumer runner against PostgREST", () => {
  it("delivers the parsed envelope and skips it on a rerun", async () => {
    const received: string[] = [];
    const consumer: EventConsumer = {
      name: EventFixtures.consumer(eventId),
      async handle(event) {
        if (event.id === eventId) {
          expect(event).toMatchObject({
            type: "order.placed",
            version: 1,
            aggregateType: "order",
            actorType: "system",
          });
          received.push(event.id);
        }
        return Results.ok(undefined);
      },
    };

    expect((await runEventConsumers([consumer])).ok).toBe(true);
    await runEventConsumers([consumer]);

    expect(received).toEqual([eventId]);
    expect(await receipt(consumer.name)).toMatchObject({
      status: "processed",
      attempts: 1,
      last_error: null,
      processed_at: expect.any(String),
    });
  });

  it("retries expected failure and clears the failure on success", async () => {
    let fail = true;
    const consumer: EventConsumer = {
      name: EventFixtures.consumer(eventId),
      async handle(event) {
        return fail && event.id === eventId
          ? Results.err("provider_unavailable")
          : Results.ok(undefined);
      },
    };

    await runEventConsumers([consumer]);
    expect(await receipt(consumer.name)).toMatchObject({
      status: "failed",
      attempts: 1,
      last_error: "handler_failed",
      processed_at: null,
    });
    fail = false;
    await runEventConsumers([consumer]);
    expect(await receipt(consumer.name)).toMatchObject({
      status: "processed",
      attempts: 2,
      last_error: null,
    });
  });

  it("isolates throwing consumers and stores no payload or error secrets", async () => {
    const output = vi.spyOn(console, "log").mockImplementation(() => undefined);
    const broken: EventConsumer = {
      name: EventFixtures.consumer(eventId),
      async handle() {
        throw new Error("handler-secret-must-not-be-logged");
      },
    };
    const healthy: EventConsumer = {
      name: EventFixtures.consumer(eventId),
      handle: async () => Results.ok(undefined),
    };

    await runEventConsumers([broken, healthy]);

    expect(await receipt(broken.name)).toMatchObject({
      status: "failed",
      last_error: "handler_failed",
    });
    expect(await receipt(healthy.name)).toMatchObject({ status: "processed" });
    expect(JSON.stringify(output.mock.calls)).not.toContain("payload-must-not-be-logged");
    expect(JSON.stringify(output.mock.calls)).not.toContain("handler-secret-must-not-be-logged");
  });

  it("records bad publisher payloads as failures without blocking other events", async () => {
    const payload = z.object({ requiredPublisherField: z.string() });
    const consumer: EventConsumer = {
      name: EventFixtures.consumer(eventId),
      async handle(event) {
        if (event.id === eventId) {
          payload.parse(event.payload);
        }
        return Results.ok(undefined);
      },
    };

    await runEventConsumers([consumer]);
    expect(await receipt(consumer.name)).toMatchObject({
      status: "failed",
      last_error: "handler_failed",
    });
  });

  it("stops retrying poison events after five failed attempts", async () => {
    let targetCalls = 0;
    const consumer: EventConsumer = {
      name: EventFixtures.consumer(eventId),
      async handle(event) {
        if (event.id === eventId) {
          targetCalls += 1;
        }
        return Results.err("provider_failure");
      },
    };

    for (let run = 0; run < 6; run += 1) {
      await runEventConsumers([consumer]);
    }

    expect(targetCalls).toBe(5);
    expect(await receipt(consumer.name)).toMatchObject({ status: "failed", attempts: 5 });
  });

  it("keeps success terminal under concurrent duplicate receipts", async () => {
    const consumer = EventFixtures.consumer(eventId);
    await Promise.all([repository.record(consumer, eventId), repository.record(consumer, eventId)]);
    await repository.record(consumer, eventId, "handler_failed");

    expect(await receipt(consumer)).toMatchObject({ status: "processed", attempts: 1 });
  });

  it("refuses anonymous event access and direct service writes", async () => {
    const anonymous = createAnonClient();
    const read = await anonymous.schema("events").from("domain_events").select("id");
    const pending = await anonymous
      .schema("events")
      .rpc("pending_events", { p_consumer: "unauthorized" });
    const write = await service
      .schema("events")
      .from("domain_events")
      .update({ version: 2 })
      .eq("id", eventId);

    expect(read.error).not.toBeNull();
    expect(pending.error).not.toBeNull();
    expect(write.error).not.toBeNull();
  });

  it("refuses duplicate or invalid consumer names before delivery", async () => {
    const handle = async () => Results.ok(undefined);
    expect(await runEventConsumers([{ name: "", handle }])).toEqual({
      ok: false,
      error: "invalid_consumer",
    });
    expect(
      await runEventConsumers([
        { name: "same", handle },
        { name: "same", handle },
      ]),
    ).toEqual({ ok: false, error: "invalid_consumer" });
    expect(await runEventConsumers([])).toEqual({ ok: true, value: { processed: 0, failed: 0 } });
  });
});
