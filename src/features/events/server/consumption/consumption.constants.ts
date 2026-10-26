import { Constants } from "@/integrations/supabase/database.types";

/**
 * One bounded oldest-first batch per consumer per run; later runs drain the remaining backlog.
 */
export const EVENT_BATCH_SIZE = 100;

/**
 * Receipt states derived from the generated database enum.
 */
export const ReceiptStatus = {
  Processed: Constants.events.Enums.receipt_status[0],
  Failed: Constants.events.Enums.receipt_status[1],
} as const;

/**
 * Matches the SQL receipt consumer-name constraint.
 */
export const MAX_CONSUMER_NAME_LENGTH = 100;
