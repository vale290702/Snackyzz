import { describe, expect, it } from "vitest";
import { deliveryQuote } from "../src/lib/delivery-zones";
const zones = [
  { id: "a", name: "Escazú", price: 2000, active: true },
  { id: "b", name: "Santa Ana", price: 3000, active: false },
];
describe("delivery quote", () => {
  it("adds the active zone fee to products", () =>
    expect(deliveryQuote(2500, "uber", "a", zones)).toEqual({
      fee: 2000,
      total: 4500,
      zone: zones[0],
    }));
  it("never charges delivery for pickup", () =>
    expect(deliveryQuote(2500, "pickup", "a", zones)).toEqual({
      fee: 0,
      total: 2500,
      zone: undefined,
    }));
  it("does not quote unavailable zones", () =>
    expect(deliveryQuote(2500, "uber", "b", zones).zone).toBeUndefined());
});

it("Espinal code waives delivery only after residence confirmation", () => {
  expect(deliveryQuote(2000,"uber","a",zones,"EspinalSnackyzz",true).total).toBe(2000);
  expect(deliveryQuote(2000,"uber","a",zones,"EspinalSnackyzz",false).total).toBe(4000);
  expect(deliveryQuote(2000,"uber","a",zones,"invalid",true).total).toBe(4000);
});
