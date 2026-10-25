import type { z } from "zod";

import type { Database } from "@/integrations/supabase/database-client.types";

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
