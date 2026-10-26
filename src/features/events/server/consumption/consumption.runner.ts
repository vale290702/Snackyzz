import "server-only";

import { z } from "zod";

import { createServiceClient } from "@/integrations/supabase/service-client";
import { createLogger, type Logger } from "@/shared/lib/logger";
import { Results, type Result } from "@/shared/lib/result";

import { MAX_CONSUMER_NAME_LENGTH } from "./consumption.constants";
import { consumptionRepository } from "./consumption.repository";
import type { DomainEvent, EventConsumer, EventRunSummary } from "./consumption.types";
import { EventError, type EventErrorCode } from "../../domain/errors/errors.constants";

const consumerNameSchema = z.string().trim().min(1).max(MAX_CONSUMER_NAME_LENGTH);

/**
 * Delivers one batch per consumer without coupling publishers to downstream features.
 * @param consumers Explicit trusted consumers from an authorized server composition root.
 * @returns Counts, or invalid configuration before any database access.
 */
export async function runEventConsumers(
  consumers: readonly EventConsumer[],
): Promise<Result<EventRunSummary, EventErrorCode>> {
  const names = consumers.map((consumer) => consumer.name);
  if (
    names.some((name) => !consumerNameSchema.safeParse(name).success) ||
    new Set(names).size !== names.length
  ) {
    return Results.err(EventError.InvalidConsumer);
  }

  const summary = { processed: 0, failed: 0 };
  if (consumers.length === 0) {
    return Results.ok(summary);
  }

  const repository = consumptionRepository(createServiceClient());
  for (const consumer of consumers) {
    const log = createLogger({ operation: "events.consume", consumer: consumer.name });
    await runConsumer(consumer, repository, summary, log);
  }

  return Results.ok(summary);
}

async function runConsumer(
  consumer: EventConsumer,
  repository: ReturnType<typeof consumptionRepository>,
  summary: EventRunSummary,
  log: Logger,
): Promise<void> {
  const pending = await repository.pending(consumer.name);
  log.step("readPending");
  if (!pending.ok) {
    summary.failed += 1;
    log.error("readPendingFailed", { code: pending.error });
    return;
  }

  for (const event of pending.value) {
    const failure = await handleEvent(consumer, event);
    log.step("handleEvent", { eventId: event.id, succeeded: failure === undefined });

    const receipt = await repository.record(consumer.name, event.id, failure);
    log.step("recordReceipt", { eventId: event.id, succeeded: receipt.ok });
    if (failure || !receipt.ok) {
      summary.failed += 1;
      log.error("deliveryFailed", {
        eventId: event.id,
        code: failure ?? EventError.ReceiptWriteFailed,
      });
    } else {
      summary.processed += 1;
    }
  }
}

async function handleEvent(
  consumer: EventConsumer,
  event: DomainEvent,
): Promise<EventErrorCode | undefined> {
  try {
    const result = await consumer.handle(event);
    if (!result.ok) {
      return EventError.HandlerFailed;
    }
  } catch {
    return EventError.HandlerFailed;
  }
}
