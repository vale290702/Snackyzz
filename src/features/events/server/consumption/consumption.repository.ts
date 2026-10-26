import "server-only";

import { z } from "zod";

import type { DatabaseClient } from "@/integrations/supabase/database-client.types";
import { Results, type Result } from "@/shared/lib/result";

import { EVENT_BATCH_SIZE, ReceiptStatus } from "./consumption.constants";
import type { DomainEvent } from "./consumption.types";
import { domainEventSchema } from "./event.schema";
import { EventError, type EventErrorCode } from "../../domain/errors/errors.constants";

/**
 * Service-only event reads and atomic receipt writes. No API role can publish events here.
 * @param client A trusted job's service-role client.
 * @returns Bounded pending reads and receipt recording.
 */
export function consumptionRepository(client: DatabaseClient) {
  return {
    pending: (consumer: string) => pending(client, consumer),
    record: (consumer: string, eventId: string, failure?: EventErrorCode) =>
      record(client, consumer, eventId, failure),
  };
}

async function pending(
  client: DatabaseClient,
  consumer: string,
): Promise<Result<DomainEvent[], EventErrorCode>> {
  const { data, error } = await client.schema("events").rpc("pending_events", {
    p_consumer: consumer,
    p_limit: EVENT_BATCH_SIZE,
  });
  if (error) {
    return Results.err(EventError.PendingReadFailed);
  }

  const parsed = z.array(domainEventSchema).safeParse(data);
  if (!parsed.success) {
    return Results.err(EventError.InvalidEvent);
  }

  return Results.ok(parsed.data);
}

async function record(
  client: DatabaseClient,
  consumer: string,
  eventId: string,
  failure?: EventErrorCode,
): Promise<Result<void, EventErrorCode>> {
  const { error } = await client.schema("events").rpc("record_receipt", {
    p_consumer: consumer,
    p_event_id: eventId,
    p_status: failure ? ReceiptStatus.Failed : ReceiptStatus.Processed,
    ...(failure ? { p_last_error: failure } : {}),
  });
  if (error) {
    return Results.err(EventError.ReceiptWriteFailed);
  }

  return Results.ok(undefined);
}
