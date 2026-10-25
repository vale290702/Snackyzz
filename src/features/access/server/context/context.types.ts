import type { DatabaseClient } from "@/integrations/supabase/database-client.types";
import type { CapabilityContext } from "@/shared/lib/capability";

import type { Admin, Permission } from "../admin";

/**
 * The concrete context passed to an admin capability.
 */
export type AdminContext = CapabilityContext<DatabaseClient, Permission, Admin>;

/**
 * The front end an admin context is built for.
 */
export type AdminContextSource = AdminContext["source"];

/**
 * Caller-supplied channel; identity and permissions come from the verified session.
 */
export type AdminContextOptions = {
  source: AdminContextSource;
};
