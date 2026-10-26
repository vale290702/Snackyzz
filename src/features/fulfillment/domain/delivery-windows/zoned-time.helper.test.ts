import { describe, expect, it } from "vitest";

import { ZonedTime } from "./zoned-time.helper";

const COSTA_RICA = "America/Costa_Rica";

describe("ZonedTime.localDate", () => {
  it("reads the calendar date in the time zone, not in UTC", () => {
    const sundayNightInCostaRica = new Date("2026-09-14T04:00:00Z");

    expect(ZonedTime.localDate(sundayNightInCostaRica, COSTA_RICA)).toEqual({
      year: 2026,
      month: 9,
      day: 13,
    });
  });
});

describe("ZonedTime.toInstant", () => {
  it("turns a wall-clock time in Costa Rica into an instant", () => {
    const instant = ZonedTime.toInstant({ year: 2026, month: 9, day: 14 }, 15 * 60, COSTA_RICA);

    expect(instant.toISOString()).toBe("2026-09-14T21:00:00.000Z");
  });

  it("follows daylight saving time in zones that observe it", () => {
    const winter = ZonedTime.toInstant(
      { year: 2026, month: 1, day: 15 },
      9 * 60,
      "America/New_York",
    );
    const summer = ZonedTime.toInstant(
      { year: 2026, month: 7, day: 15 },
      9 * 60,
      "America/New_York",
    );

    expect(winter.toISOString()).toBe("2026-01-15T14:00:00.000Z");
    expect(summer.toISOString()).toBe("2026-07-15T13:00:00.000Z");
  });
});

describe("ZonedTime.addDays", () => {
  it("rolls over months and years", () => {
    expect(ZonedTime.addDays({ year: 2026, month: 12, day: 30 }, 3)).toEqual({
      year: 2027,
      month: 1,
      day: 2,
    });
  });
});

describe("ZonedTime.isoWeekday", () => {
  it("numbers Monday 1 and Sunday 7", () => {
    expect(ZonedTime.isoWeekday({ year: 2026, month: 9, day: 14 })).toBe(1);
    expect(ZonedTime.isoWeekday({ year: 2026, month: 9, day: 20 })).toBe(7);
  });
});
