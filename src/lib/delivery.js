const keys = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
const zone = "America/Costa_Rica";
function isoDate(date) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: zone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(date);
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${value.year}-${value.month}-${value.day}`;
}
function minutes(value) {
  const [hour, minute] = value.split(":").map(Number);
  return hour * 60 + minute;
}
function clock(value) {
  return `${String(Math.floor(value / 60)).padStart(2, "0")}:${String(value % 60).padStart(2, "0")}`;
}
function dayKey(date) {
  return keys[new Date(`${date}T12:00:00-06:00`).getUTCDay()];
}
export function deliveryDates(schedule = {}, now = new Date(), count = 14) {
  const anchor = new Date(`${isoDate(now)}T12:00:00-06:00`);
  const formatter = new Intl.DateTimeFormat("es-CR", { timeZone: zone, weekday: "long", day: "numeric", month: "long" });
  const result = [];
  for (let offset = 0; offset < count; offset++) {
    const date = new Date(anchor.getTime() + offset * 86400000);
    const value = isoDate(date);
    if (schedule[dayKey(value)]?.enabled) result.push({ value, label: formatter.format(date) });
  }
  return result;
}
export function deliverySlots({ date, schedule = {}, slotHours = 3, leadHours = 6, now = new Date() }) {
  const day = schedule[dayKey(date)];
  if (!date || !day?.enabled) return [];
  const start = minutes(day.start), end = minutes(day.end), duration = slotHours * 60;
  const minimum = now.getTime() + leadHours * 3600000;
  const formatter = new Intl.DateTimeFormat("es-CR", { timeZone: zone, hour: "numeric", minute: "2-digit" });
  const result = [];
  for (let value = start; value + duration <= end; value += duration) {
    const begins = new Date(`${date}T${clock(value)}:00-06:00`);
    if (begins.getTime() < minimum) continue;
    const finishes = new Date(`${date}T${clock(value + duration)}:00-06:00`);
    result.push({ value: clock(value), label: `${formatter.format(begins)} – ${formatter.format(finishes)}` });
  }
  return result;
}
