import { describe, expect, it } from "vitest";

import { DELIVERY_WINDOW_DAYS } from "./delivery-windows.constants";
import { DeliveryWindows } from "./delivery-windows.helper";
import type { DeliveryWindowInput } from "./delivery-windows.types";
import type { HourRange } from "../hours";

const COSTA_RICA = "America/Costa_Rica";

/**
 * Today's store: Monday to Friday 9:00–18:00 except Tuesday, Saturday 9:00–15:00, Sunday closed.
 */
const SCHEDULE: HourRange[] = [
  { weekday: 1, opensAt: "09:00", closesAt: "18:00" },
  { weekday: 3, opensAt: "09:00", closesAt: "18:00" },
  { weekday: 4, opensAt: "09:00", closesAt: "18:00" },
  { weekday: 5, opensAt: "09:00", closesAt: "18:00" },
  { weekday: 6, opensAt: "09:00", closesAt: "15:00" },
];

function input(overrides: Partial<DeliveryWindowInput>): DeliveryWindowInput {
  return {
    hours: SCHEDULE,
    leadHours: 6,
    slotHours: 3,
    timezone: COSTA_RICA,
    now: new Date("2026-09-14T08:00:00-06:00"),
    ...overrides,
  };
}

function window(startsAt: string, endsAt: string) {
  return {
    startsAt: new Date(startsAt).toISOString(),
    endsAt: new Date(endsAt).toISOString(),
  };
}

describe("DeliveryWindows.list", () => {
  it("cuts each day's hours into windows that start after the lead time", () => {
    const windows = DeliveryWindows.list(input({}));

    expect(windows.slice(0, 4)).toEqual([
      window("2026-09-14T15:00:00-06:00", "2026-09-14T18:00:00-06:00"),
      window("2026-09-16T09:00:00-06:00", "2026-09-16T12:00:00-06:00"),
      window("2026-09-16T12:00:00-06:00", "2026-09-16T15:00:00-06:00"),
      window("2026-09-16T15:00:00-06:00", "2026-09-16T18:00:00-06:00"),
    ]);
  });

  it("skips weekdays without hours", () => {
    const windows = DeliveryWindows.list(input({}));
    const localDays = windows.map((each) => new Date(each.startsAt).getTime() - 6 * 3_600_000);
    const weekdays = new Set(localDays.map((time) => new Date(time).getUTCDay()));

    expect(weekdays.has(2)).toBe(false);
    expect(weekdays.has(0)).toBe(false);
  });

  it("pushes the first window into the next open day when the lead time runs past closing", () => {
    const windows = DeliveryWindows.list(input({ now: new Date("2026-09-16T13:00:00-06:00") }));

    expect(windows[0]).toEqual(window("2026-09-17T09:00:00-06:00", "2026-09-17T12:00:00-06:00"));
  });

  it("uses the local date when it is already tomorrow in UTC", () => {
    const sundayEvening: HourRange = { weekday: 7, opensAt: "21:00", closesAt: "23:00" };
    const windows = DeliveryWindows.list(
      input({
        hours: [sundayEvening],
        leadHours: 0,
        slotHours: 1,
        now: new Date("2026-09-13T21:30:00-06:00"),
      }),
    );

    expect(windows[0]).toEqual(window("2026-09-13T22:00:00-06:00", "2026-09-13T23:00:00-06:00"));
  });

  it("leaves out the tail of a range shorter than a window", () => {
    const saturday: HourRange = { weekday: 6, opensAt: "09:00", closesAt: "15:00" };
    const windows = DeliveryWindows.list(input({ hours: [saturday], slotHours: 4 }));

    expect(windows[0]).toEqual(window("2026-09-19T09:00:00-06:00", "2026-09-19T13:00:00-06:00"));
    expect(windows[1]).toEqual(window("2026-09-26T09:00:00-06:00", "2026-09-26T13:00:00-06:00"));
  });

  it("supports windows from 1 to 12 hours", () => {
    const longMonday: HourRange = { weekday: 1, opensAt: "08:00", closesAt: "20:00" };
    const now = new Date("2026-09-13T08:00:00-06:00");

    const hourly = DeliveryWindows.list(input({ hours: [longMonday], slotHours: 1, now }));
    const halfDay = DeliveryWindows.list(input({ hours: [longMonday], slotHours: 12, now }));

    expect(hourly).toHaveLength(24);
    expect(hourly[11]).toEqual(window("2026-09-14T19:00:00-06:00", "2026-09-14T20:00:00-06:00"));
    expect(halfDay[0]).toEqual(window("2026-09-14T08:00:00-06:00", "2026-09-14T20:00:00-06:00"));
  });

  it("lists split ranges in chronological order whatever order they arrive in", () => {
    const afternoon: HourRange = { weekday: 1, opensAt: "14:00", closesAt: "16:00" };
    const morning: HourRange = { weekday: 1, opensAt: "09:00", closesAt: "11:00" };
    const windows = DeliveryWindows.list(
      input({
        hours: [afternoon, morning],
        slotHours: 2,
        now: new Date("2026-09-13T08:00:00-06:00"),
      }),
    );

    expect(windows.slice(0, 2)).toEqual([
      window("2026-09-14T09:00:00-06:00", "2026-09-14T11:00:00-06:00"),
      window("2026-09-14T14:00:00-06:00", "2026-09-14T16:00:00-06:00"),
    ]);
  });

  it("looks ahead a fixed number of days", () => {
    const everyDay: HourRange[] = [1, 2, 3, 4, 5, 6, 7].map((weekday) => ({
      weekday,
      opensAt: "09:00",
      closesAt: "12:00",
    }));
    const windows = DeliveryWindows.list(
      input({ hours: everyDay, leadHours: 0, now: new Date("2026-09-14T00:00:00-06:00") }),
    );

    expect(windows).toHaveLength(DELIVERY_WINDOW_DAYS);
  });

  it("lists nothing when delivery has no hours", () => {
    expect(DeliveryWindows.list(input({ hours: [] }))).toEqual([]);
  });
});

describe("DeliveryWindows.isAvailable", () => {
  it("accepts a window the customer could pick, in any ISO notation", () => {
    const chosen = { startsAt: "2026-09-14T15:00:00-06:00", endsAt: "2026-09-14T18:00:00-06:00" };

    expect(DeliveryWindows.isAvailable(chosen, input({}))).toBe(true);
  });

  it("refuses windows that are too soon, misaligned or on a closed day", () => {
    const refused = [
      window("2026-09-14T09:00:00-06:00", "2026-09-14T12:00:00-06:00"),
      window("2026-09-16T10:00:00-06:00", "2026-09-16T13:00:00-06:00"),
      window("2026-09-15T09:00:00-06:00", "2026-09-15T12:00:00-06:00"),
      window("2026-09-16T09:00:00-06:00", "2026-09-16T11:00:00-06:00"),
    ];

    for (const chosen of refused) {
      expect(DeliveryWindows.isAvailable(chosen, input({})), chosen.startsAt).toBe(false);
    }
  });
});
