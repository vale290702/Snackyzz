import type { LocalDate } from "./delivery-windows.types";

const MILLISECONDS_PER_MINUTE = 60_000;

const DAYS_PER_WEEK = 7;

/**
 * Calendar math in an IANA time zone, using only `Intl`. Schedules are wall-clock times, so they
 * become instants only once a date and zone are known.
 */
export class ZonedTime {
  private constructor() {}

  /**
   * Reads the calendar date of an instant in a time zone.
   * @param instant The moment to read.
   * @param timezone An IANA zone, such as America/Costa_Rica.
   * @returns The local date.
   */
  static localDate(instant: Date, timezone: string): LocalDate {
    const wallClock = ZonedTime.wallClock(instant, timezone);

    return {
      year: wallClock.getUTCFullYear(),
      month: wallClock.getUTCMonth() + 1,
      day: wallClock.getUTCDate(),
    };
  }

  /**
   * Finds the instant a wall-clock time happens on a local date.
   * @param date The local date.
   * @param minutes Minutes after local midnight.
   * @param timezone An IANA zone.
   * @returns The instant.
   */
  static toInstant(date: LocalDate, minutes: number, timezone: string): Date {
    const wallClockAsUtc = Date.UTC(date.year, date.month - 1, date.day, 0, minutes);

    // The offset can differ between the guess and the answer around daylight-saving changes, so
    // it is read again at the first estimate.
    const estimate =
      wallClockAsUtc -
      ZonedTime.offsetMinutes(new Date(wallClockAsUtc), timezone) * MILLISECONDS_PER_MINUTE;
    const offset = ZonedTime.offsetMinutes(new Date(estimate), timezone);

    return new Date(wallClockAsUtc - offset * MILLISECONDS_PER_MINUTE);
  }

  /**
   * Moves a local date by whole days.
   * @param date The local date.
   * @param days Days to add.
   * @returns The new local date.
   */
  static addDays(date: LocalDate, days: number): LocalDate {
    const moved = new Date(Date.UTC(date.year, date.month - 1, date.day + days));

    return {
      year: moved.getUTCFullYear(),
      month: moved.getUTCMonth() + 1,
      day: moved.getUTCDate(),
    };
  }

  /**
   * Names a local date's weekday.
   * @param date The local date.
   * @returns The ISO weekday: 1 is Monday, 7 is Sunday.
   */
  static isoWeekday(date: LocalDate): number {
    const sundayFirst = new Date(Date.UTC(date.year, date.month - 1, date.day)).getUTCDay();

    return sundayFirst === 0 ? DAYS_PER_WEEK : sundayFirst;
  }

  /**
   * Reads the zone's wall clock at an instant.
   * @param instant The moment to read.
   * @param timezone An IANA zone.
   * @returns A UTC date whose fields equal the zone's wall clock, to the minute.
   */
  private static wallClock(instant: Date, timezone: string): Date {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      hourCycle: "h23",
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
    });
    const parts = Object.fromEntries(
      formatter.formatToParts(instant).map((part) => [part.type, Number(part.value)]),
    );

    return new Date(
      Date.UTC(parts.year ?? 0, (parts.month ?? 1) - 1, parts.day ?? 1, parts.hour, parts.minute),
    );
  }

  /**
   * Measures how far the zone's wall clock is ahead of UTC at an instant.
   * @param instant The moment to measure.
   * @param timezone An IANA zone.
   * @returns Minutes ahead of UTC; negative in the Americas.
   */
  private static offsetMinutes(instant: Date, timezone: string): number {
    const wallClock = ZonedTime.wallClock(instant, timezone);

    return Math.round((wallClock.getTime() - instant.getTime()) / MILLISECONDS_PER_MINUTE);
  }
}
