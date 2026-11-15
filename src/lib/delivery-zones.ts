import { validatePromotion } from "../../supabase/functions/_shared/commerce";
import type { DeliveryZone } from "../types/store";
export function deliveryQuote(
  subtotal: number,
  method: string,
  zoneId: string,
  zones: DeliveryZone[] = [],
  promoCode = "",
  espinalResident = false,
) {
  const zone =
    method === "uber"
      ? zones.find((zone) => zone.id === zoneId && zone.active)
      : undefined;
  let freeDelivery = false;
  try { freeDelivery = Boolean(validatePromotion(promoCode, method, espinalResident)); } catch { /* Invalid codes never discount the quote. */ }
  const fee = freeDelivery ? 0 : zone?.price ?? 0;
  return { zone, fee, total: subtotal + fee };
}
