import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "./database.types";

/**
 * A Supabase client typed with the generated schema; which role it acts as depends on its factory.
 */
export type DatabaseClient = SupabaseClient<Database>;

export type { Database };
