import { MINUTES_PER_HOUR } from "./hours.constants";
import type { HourRange } from "./hours.types";

/**
 * Rules over the hour ranges of a weekly schedule; times are `HH:MM`.
 */
export class HourRanges {
  private constructor() {}

  /**
   * Converts a time into minutes after midnight.
   * @param time A validated `HH:MM` time.
   * @returns Minutes after midnight.
   */
  static toMinutes(time: string): number {
    const [hours = 0, minutes = 0] = time.split(":").map(Number);

    return hours * MINUTES_PER_HOUR + minutes;
  }

  /**
   * Sorts ranges by weekday, then by opening time.
   * @param ranges Ranges in any order.
   * @returns A sorted copy.
   */
  static sort(ranges: readonly HourRange[]): HourRange[] {
    return [...ranges].sort((first, second) => {
      if (first.weekday !== second.weekday) {
        return first.weekday - second.weekday;
      }

      return HourRanges.toMinutes(first.opensAt) - HourRanges.toMinutes(second.opensAt);
    });
  }

  /**
   * Tells whether two ranges on the same weekday share any minute. Touching ranges (9–12, 12–15)
   * do not overlap, as in the database's exclusion constraints.
   * @param ranges The schedule's ranges.
   * @returns True when any two overlap.
   */
  static hasOverlap(ranges: readonly HourRange[]): boolean {
    const sorted = HourRanges.sort(ranges);

    return sorted.some((range, index) => {
      const previous = sorted[index - 1];
      if (previous === undefined || previous.weekday !== range.weekday) {
        return false;
      }

      return HourRanges.toMinutes(range.opensAt) < HourRanges.toMinutes(previous.closesAt);
    });
  }
}
