import test from "node:test";
import assert from "node:assert/strict";
import { deliveryDates, deliverySlots } from "../src/lib/delivery.js";

const schedule = {
  mon: { enabled: true, start: "09:00", end: "18:00" },
  tue: { enabled: false, start: "09:00", end: "18:00" },
  wed: { enabled: true, start: "09:00", end: "18:00" },
  thu: { enabled: true, start: "09:00", end: "18:00" },
  fri: { enabled: true, start: "09:00", end: "18:00" },
  sat: { enabled: true, start: "09:00", end: "15:00" },
  sun: { enabled: false, start: "09:00", end: "15:00" },
};

test("delivery dates exclude disabled weekdays", () => {
  const dates = deliveryDates(schedule, new Date("2026-09-14T08:00:00-06:00"), 7);
  assert.equal(dates.some((item) => item.value === "2026-09-15"), false);
  assert.equal(dates.some((item) => item.value === "2026-09-16"), true);
});

test("delivery slots respect duration and minimum notice", () => {
  const slots = deliverySlots({ date: "2026-09-14", schedule, slotHours: 3, leadHours: 6, now: new Date("2026-09-14T08:00:00-06:00") });
  assert.deepEqual(slots.map((slot) => slot.value), ["15:00"]);
  assert.equal(slots[0].label, "3:00 p. m. – 6:00 p. m.");
});
