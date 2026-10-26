import type { HourRange } from "../hours";

/**
 * Everything delivery windows are cut from. `now` is injected so the rules stay pure.
 */
export type DeliveryWindowInput = {
  hours: readonly HourRange[];
  leadHours: number;
  slotHours: number;
  timezone: string;
  now: Date;
};

/**
 * A time slot a delivery can arrive in, as ISO instants.
 */
export type DeliveryWindow = {
  startsAt: string;
  endsAt: string;
};

/**
 * A calendar date in a time zone; `month` is 1 for January.
 */
export type LocalDate = {
  year: number;
  month: number;
  day: number;
};
