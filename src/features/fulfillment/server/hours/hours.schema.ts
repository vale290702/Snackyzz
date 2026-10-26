import { z } from "zod";

/**
 * Columns read for an hour row, of a pickup location or of delivery.
 */
export const HOUR_COLUMNS = "weekday, opens_at, closes_at";

/**
 * Parses an hour row; Postgres returns times as `HH:MM:SS`, and hours are whole minutes.
 */
export const hourRowSchema = z
  .object({
    weekday: z.int().min(1).max(7),
    opens_at: z.iso.time(),
    closes_at: z.iso.time(),
  })
  .transform((row) => ({
    weekday: row.weekday,
    opensAt: row.opens_at.slice(0, 5),
    closesAt: row.closes_at.slice(0, 5),
  }));
