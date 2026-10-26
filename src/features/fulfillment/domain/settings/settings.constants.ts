/**
 * How far ahead deliveries must be ordered, in hours; mirrors `settings_delivery_lead_hours_check`.
 */
export const DeliveryLeadHours = {
  Min: 0,
  Max: 168,
} as const;

/**
 * How long a delivery window lasts, in hours; mirrors `settings_delivery_slot_hours_check`.
 */
export const DeliverySlotHours = {
  Min: 1,
  Max: 12,
} as const;
