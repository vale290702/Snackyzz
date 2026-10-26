import type { z } from "zod";

import type { Result } from "@/shared/lib/result";

import type { domainEventSchema } from "./event.schema";

/**
 * Immutable event envelope. Publishers own the payload schema and its version contract.
 */
export type DomainEvent<EventType extends string = string, Payload = unknown> = Omit<
  z.infer<typeof domainEventSchema>,
  "type" | "payload"
> & { type: EventType; payload: Payload };

/**
 * Trusted server consumer. Parse publisher payloads before use; acknowledge unrelated events.
 * Resolve successfully only after idempotent side effects have been safely queued.
 */
export type EventConsumer = {
  name: string;
  handle: (event: DomainEvent) => Promise<Result<void>>;
};

/**
 * Counts for one bounded pass; failed includes handler, parsing and persistence failures.
 */
export type EventRunSummary = {
  processed: number;
  failed: number;
};
