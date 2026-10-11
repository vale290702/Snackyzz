import type { DeliveryZone } from "../types/store";
export function deliveryQuote(
  subtotal: number,
  method: string,
  zoneId: string,
  zones: DeliveryZone[] = [],
) {
  const zone =
    method === "uber"
      ? zones.find((zone) => zone.id === zoneId && zone.active)
      : undefined;
  const fee = zone?.price ?? 0;
  return { zone, fee, total: subtotal + fee };
}
