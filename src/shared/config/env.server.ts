import "server-only";

import { z } from "zod";

import { parseEnv } from "./parse-env";

const serverEnvSchema = z.object({
  SUPABASE_SECRET_KEY: z.string().min(1),
  MEDIA_SIGNING_SECRET: z.string().min(32),
});

export const serverEnv = parseEnv(serverEnvSchema, {
  SUPABASE_SECRET_KEY: process.env.SUPABASE_SECRET_KEY,
  MEDIA_SIGNING_SECRET: process.env.MEDIA_SIGNING_SECRET,
});
