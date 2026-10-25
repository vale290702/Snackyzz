import { z } from "zod";

import { Constants } from "@/integrations/supabase/database.types";

/**
 * Parses the permissions returned by `access.my_permissions()`.
 */
export const permissionsSchema = z.array(z.enum(Constants.access.Enums.permission));

/**
 * Parses an `access.admins` row into the app's admin shape.
 */
export const adminSchema = z
  .object({
    user_id: z.uuid(),
    display_name: z.string().min(1),
    role: z.enum(Constants.access.Enums.admin_role),
  })
  .transform((row) => ({
    id: row.user_id,
    displayName: row.display_name,
    role: row.role,
  }));
