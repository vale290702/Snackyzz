import { DELIVERY_WINDOW_DAYS } from "./delivery-windows.constants";
import type { DeliveryWindow, DeliveryWindowInput, LocalDate } from "./delivery-windows.types";
import { ZonedTime } from "./zoned-time.helper";
import { HourRanges, MINUTES_PER_HOUR, type HourRange } from "../hours";

const MILLISECONDS_PER_HOUR = 3_600_000;

/**
 * The delivery windows customers can pick. Checkout lists them with the same input the server
 * re-validates the chosen one against, so both always agree.
 */
export class DeliveryWindows {
  private constructor() {}

  /**
   * Lists the delivery windows a customer can pick from: each day's hours cut into windows of
   * `slotHours`, starting at least `leadHours` after `now`, for the next two weeks.
   * @param input Delivery hours, lead and window lengths, time zone and the current time.
   * @returns Windows in chronological order; empty when delivery has no hours.
   */
  static list(input: DeliveryWindowInput): DeliveryWindow[] {
    const earliestStart = input.now.getTime() + input.leadHours * MILLISECONDS_PER_HOUR;
    const today = ZonedTime.localDate(input.now, input.timezone);
    const sortedHours = HourRanges.sort(input.hours);

    const windows: DeliveryWindow[] = [];
    for (let dayOffset = 0; dayOffset < DELIVERY_WINDOW_DAYS; dayOffset += 1) {
      const date = ZonedTime.addDays(today, dayOffset);
      const weekday = ZonedTime.isoWeekday(date);
      const dayHours = sortedHours.filter((range) => range.weekday === weekday);

      for (const range of dayHours) {
        windows.push(...DeliveryWindows.cut(range, date, input));
      }
    }

    return windows.filter((window) => Date.parse(window.startsAt) >= earliestStart);
  }

  /**
   * Tells whether a chosen window is still one the customer could pick right now.
   * @param window The chosen window; any ISO notation of the same instants matches.
   * @param input The same input `list` takes.
   * @returns True when the window is listed.
   */
  static isAvailable(window: DeliveryWindow, input: DeliveryWindowInput): boolean {
    const startsAt = Date.parse(window.startsAt);
    const endsAt = Date.parse(window.endsAt);

    return DeliveryWindows.list(input).some(
      (candidate) =>
        Date.parse(candidate.startsAt) === startsAt && Date.parse(candidate.endsAt) === endsAt,
    );
  }

  /**
   * Cuts one range into back-to-back windows from its opening time; a tail shorter than a window
   * is left out.
   * @param range The opening range.
   * @param date The local date it falls on.
   * @param input The window length and time zone.
   * @returns The range's windows.
   */
  private static cut(
    range: HourRange,
    date: LocalDate,
    input: DeliveryWindowInput,
  ): DeliveryWindow[] {
    const windowMinutes = input.slotHours * MINUTES_PER_HOUR;
    const closesAt = HourRanges.toMinutes(range.closesAt);

    const windows: DeliveryWindow[] = [];
    let startMinutes = HourRanges.toMinutes(range.opensAt);
    while (startMinutes + windowMinutes <= closesAt) {
      const startsAt = ZonedTime.toInstant(date, startMinutes, input.timezone);
      const endsAt = ZonedTime.toInstant(date, startMinutes + windowMinutes, input.timezone);
      windows.push({ startsAt: startsAt.toISOString(), endsAt: endsAt.toISOString() });

      startMinutes += windowMinutes;
    }

    return windows;
  }
}
