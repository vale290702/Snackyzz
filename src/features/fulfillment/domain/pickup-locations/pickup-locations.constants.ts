/**
 * Longest pickup location texts; mirrors the `pickup_locations_*_check` constraints.
 */
export const PickupLocationTextLimit = {
  Name: 120,
  Address: 300,
  City: 80,
  Instructions: 500,
} as const;
