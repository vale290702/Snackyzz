import type { z } from "zod";

import type { DatabaseClient, Database } from "@/integrations/supabase/database-client.types";
import type { CapabilityContext } from "@/shared/lib/capability";

import type { adminSchema } from "./admin.schema";

/**
 * Something an admin may do; the set and the role map live in SQL (`access.permission`).
 */
export type Permission = Database["access"]["Enums"]["permission"];

/**
 * An admin's role on the roster.
 */
export type AdminRole = Database["access"]["Enums"]["admin_role"];

/**
 * An active admin as the rest of the app sees them; never includes auth or session data.
 */
export type Admin = z.output<typeof adminSchema>;

/**
 * The signed-in admin with their SQL-supplied permissions and the RLS-scoped client they act through.
 */
export type AdminSession = {
  readonly admin: Admin;
  readonly permissions: ReadonlySet<Permission>;
  readonly client: DatabaseClient;
};

/**
 * The concrete capability context every admin capability's `execute` receives.
 */
export type AdminContext = CapabilityContext<DatabaseClient, Permission, Admin>;

/**
 * The front end an admin context is built for.
 */
export type AdminContextSource = AdminContext["source"];
