/** Supported capability operations. */
export const CapabilityKind = {
  Query: "query",
  Mutation: "mutation",
} as const;

/** Trusted entry channels recorded with capability execution. */
export const CapabilitySource = {
  AdminWeb: "admin_web",
  Messaging: "messaging",
} as const;
