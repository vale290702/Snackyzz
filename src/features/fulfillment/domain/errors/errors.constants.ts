/**
 * Expected failures of fulfillment management; copy lives in `errors.fulfillment`.
 */
export const FulfillmentError = {
  PickupLocationNotFound: "pickup_location_not_found",
  DeliveryZoneNotFound: "delivery_zone_not_found",
  ZoneNameTaken: "zone_name_taken",
} as const;

/**
 * An expected fulfillment failure.
 */
export type FulfillmentErrorCode = (typeof FulfillmentError)[keyof typeof FulfillmentError];
