import type { DatabaseClient } from "@/integrations/supabase/database-client.types";

import type { Admin, Permission } from "../admin";

/**
 * A verified admin with SQL-supplied permissions and the client they act through.
 */
export type AdminSession = {
  readonly admin: Admin;
  readonly permissions: ReadonlySet<Permission>;
  readonly client: DatabaseClient;
};
