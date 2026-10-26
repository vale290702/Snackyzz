import { z } from "zod";

import { Constants } from "@/integrations/supabase/database.types";

/**
 * Database event envelope; publishers separately own their payload schemas.
 */
export const domainEventSchema = z
  .object({
    id: z.uuid(),
    type: z.string().regex(/^[a-z_]+\.[a-z_]+$/),
    version: z.number().int().min(1).max(32767),
    aggregate_type: z.string().trim().min(1),
    aggregate_id: z.uuid(),
    payload: z.json(),
    actor_type: z.enum(Constants.events.Enums.actor_type),
    actor_admin_id: z.uuid().nullable(),
    occurred_at: z.iso.datetime({ offset: true }),
  })
  .transform((row) => ({
    id: row.id,
    type: row.type,
    version: row.version,
    aggregateType: row.aggregate_type,
    aggregateId: row.aggregate_id,
    payload: row.payload,
    actorType: row.actor_type,
    actorAdminId: row.actor_admin_id,
    occurredAt: row.occurred_at,
  }));
